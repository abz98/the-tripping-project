/**
 * Auth Service
 * Handles authentication business logic including registration, login, logout, and token refresh
 *
 * Requirements:
 * - 1.1: Create new user account with hashed password and return success response with user details (excluding password)
 * - 1.2: Reject registration if email already exists with conflict error
 * - 1.3: Hash password using bcrypt with minimum cost factor of 10
 * - 1.4: Reject if missing required fields with validation error
 * - 1.5: Reject if invalid email format with validation error
 * - 1.6: Reject if password shorter than 8 characters with validation error
 * - 2.1: Verify credentials and return both access token and refresh token
 * - 2.2: Reject login with invalid credentials with unauthorized error
 * - 2.3: Generate access token with user's ID and role embedded in payload
 * - 2.4: Generate refresh token and store it in database
 * - 2.5: Return same unauthorized error for non-existent email to prevent user enumeration
 * - 4.1: Generate new access token when valid refresh token is submitted
 * - 4.2: Reject expired refresh token with unauthorized error
 * - 4.3: Reject refresh token not in database with unauthorized error
 * - 4.4: Reject invalid/malformed refresh token with unauthorized error
 * - 5.1: Remove refresh token from database on logout
 * - 5.2: Return bad request error if no refresh token provided
 * - 5.3: Return success for already invalidated refresh token (idempotent)
 */

import mongoose from "mongoose";
import { User } from "../../models/users/users.model.js";
import { Role } from "../../models/roles/roles.model.js";
import { passwordService } from "../password/password.service.js";
import { tokenService, TokenError } from "../token/token.service.js";
import { otpService } from "../otp/otp.service.js";
import { emailService } from "../email/email.service.js";
import { DEFAULT_ROLE, VALID_ROLES, RoleName } from "../../constants/roles.js";
import {
  ValidationError,
  ConflictError,
  NotFoundError,
  AuthenticationError,
} from "./auth.errors.js";
import { config } from "../../config/env.config.js";

/**
 * Data Transfer Object for user registration
 */
export interface RegisterDTO {
  email: string;
  password: string;
  full_name: string;
  role?: string; // defaults to TRAVELLER
}

/**
 * Data Transfer Object for user login
 */
export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Auth tokens response object
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * User response object (without password)
 */
export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_verified: boolean;
  createdAt: Date;
}

/**
 * Interface for the Auth Service
 */
export interface IAuthService {
  register(data: RegisterDTO): Promise<UserResponse>;
  login(data: LoginDTO): Promise<AuthTokens>;
  logout(refreshToken: string): Promise<void>;
  refreshTokens(refreshToken: string): Promise<AuthTokens>;
  getCurrentUser(userId: string): Promise<UserResponse>;
  verifyEmail(email: string, otp: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(email: string, otp: string, newPassword: string): Promise<void>;
}

/**
 * Email validation regex pattern
 * Validates standard email format: local@domain.tld
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Minimum password length requirement
 */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Parse duration string to seconds
 * Supports formats like "7d", "30d", "1h", "60m", "3600s"
 * @param duration - Duration string (e.g., "7d", "30d")
 * @returns Duration in seconds
 */
function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/^(\d+)([dhms])$/);
  if (!match) {
    // Default to 15 minutes if format is invalid
    return 15 * 60;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60;
    case "h":
      return value * 60 * 60;
    case "m":
      return value * 60;
    case "s":
      return value;
    default:
      return 15 * 60;
  }
}

/**
 * Validate registration input data
 * @param data - Registration data to validate
 * @throws ValidationError if validation fails
 *
 * Requirements: 1.4, 1.5, 1.6
 */
function validateRegistrationInput(data: RegisterDTO): void {
  const errors: Record<string, string> = {};

  // Check required fields (Requirement 1.4)
  if (!data.email || data.email.trim() === "") {
    errors.email = "Email is required";
  }

  if (!data.password || data.password === "") {
    errors.password = "Password is required";
  }

  if (!data.full_name || data.full_name.trim() === "") {
    errors.full_name = "Full name is required";
  }

  // If there are missing required fields, throw immediately
  if (Object.keys(errors).length > 0) {
    const missingFields = Object.keys(errors).join(", ");
    throw new ValidationError(`Validation failed: ${missingFields} is required`, errors);
  }

  // Validate email format (Requirement 1.5)
  if (!EMAIL_REGEX.test(data.email)) {
    throw new ValidationError("Invalid email format", { email: "Invalid email format" });
  }

  // Validate password length (Requirement 1.6)
  if (data.password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError("Password must be at least 8 characters", {
      password: "Password must be at least 8 characters",
    });
  }

  // Validate role if provided
  if (data.role && !VALID_ROLES.includes(data.role as RoleName)) {
    throw new ValidationError(`Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`, {
      role: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`,
    });
  }
}

/**
 * Auth Service implementation
 * Provides authentication operations including registration, login, logout, and token refresh
 */
export const authService: IAuthService = {
  /**
   * Register a new user
   * @param data - Registration data (email, password, full_name, optional role)
   * @returns User response without password
   * @throws ValidationError if input validation fails
   * @throws ConflictError if email already exists
   * @throws NotFoundError if role is not found
   *
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
   */
  async register(data: RegisterDTO): Promise<UserResponse> {
    // Validate input data (Requirements 1.4, 1.5, 1.6)
    validateRegistrationInput(data);

    // Check for existing user with same email (Requirement 1.2)
    const existingUser = await User.findOne({ email: data.email.toLowerCase() });
    if (existingUser) {
      if (existingUser.is_verified) {
        throw new ConflictError("User already exists");
      } else {
        // User exists but not verified, send new OTP
        const otp = await otpService.generateOTP(existingUser.email);

        // Send OTP email (non-blocking)
        emailService
          .sendOTPEmail(existingUser.email, otp, existingUser.full_name)
          .catch((error) => {
            console.error("Failed to send OTP email:", error);
          });

        // Get user's role name
        const role = await Role.findById(existingUser.role_id);
        const roleName = role?.name || DEFAULT_ROLE;

        // Return existing user data without password
        const userResponse: UserResponse = {
          id: (existingUser._id as mongoose.Types.ObjectId).toString(),
          email: existingUser.email,
          full_name: existingUser.full_name,
          role: roleName,
          is_verified: existingUser.is_verified,
          createdAt: existingUser.createdAt,
        };

        return userResponse;
      }
    }

    // Determine role (default to TRAVELLER if not specified)
    const roleName = data.role || DEFAULT_ROLE;

    // Find role by name
    const role = await Role.findOne({ name: roleName, is_active: true });
    if (!role) {
      throw new NotFoundError(`Role '${roleName}' not found`);
    }

    // Hash password using password service (Requirement 1.3)
    const passwordHash = await passwordService.hash(data.password);

    // Create user with role_id (Requirement 1.1)
    const user = await User.create({
      email: data.email.toLowerCase(),
      password_hash: passwordHash,
      full_name: data.full_name.trim(),
      role_id: role._id,
      is_verified: false,
    });

    // Generate OTP and store in Redis (10 minutes expiry)
    const otp = await otpService.generateOTP(user.email);

    // Send OTP email to user (non-blocking)
    emailService.sendOTPEmail(user.email, otp, user.full_name).catch((error) => {
      console.error("Failed to send OTP email:", error);
    });

    // Return user data without password (Requirement 1.1)
    const userResponse: UserResponse = {
      id: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      full_name: user.full_name,
      role: roleName,
      is_verified: user.is_verified,
      createdAt: user.createdAt,
    };

    return userResponse;
  },

  /**
   * Login a user with email and password
   * @param data - Login credentials (email, password)
   * @returns Auth tokens (accessToken, refreshToken, expiresIn)
   * @throws AuthenticationError if credentials are invalid
   *
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  async login(data: LoginDTO): Promise<AuthTokens> {
    // Find user by email (Requirement 2.5 - same error for non-existent email)
    const user = await User.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      // Return same error as invalid password to prevent user enumeration (Requirement 2.5)
      throw new AuthenticationError("Invalid email or password");
    }

    // Check if user is verified
    if (!user.is_verified) {
      throw new AuthenticationError("Please verify your email before logging in");
    }

    // Verify password using password service (Requirement 2.2)
    const isPasswordValid = await passwordService.verify(data.password, user.password_hash);
    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid email or password");
    }

    // Get user's role name for token payload
    const role = await Role.findById(user.role_id);
    const roleName = role?.name || DEFAULT_ROLE;

    // Generate access token with user's ID, role, email, and name (Requirement 2.3)
    const accessToken = tokenService.generateAccessToken({
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      role: roleName,
      email: user.email,
      name: user.full_name,
    });

    // Generate refresh token (Requirement 2.4)
    const refreshToken = tokenService.generateRefreshToken({
      userId: (user._id as mongoose.Types.ObjectId).toString(),
      role: roleName,
      email: user.email,
      name: user.full_name,
    });

    // Store refresh token in database (Requirement 2.4)
    await tokenService.storeRefreshToken(
      (user._id as mongoose.Types.ObjectId).toString(),
      refreshToken,
    );

    // Calculate expiration time in seconds
    const expiresIn = parseDurationToSeconds(config.jwt.expiresIn);

    // Return tokens (Requirement 2.1)
    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  },

  /**
   * Logout a user by invalidating their refresh token
   * @param refreshToken - The refresh token to invalidate
   * @throws ValidationError if no refresh token provided
   *
   * Requirements: 5.1, 5.2, 5.3
   */
  async logout(refreshToken: string): Promise<void> {
    // Check if refresh token is provided (Requirement 5.2)
    if (!refreshToken || refreshToken.trim() === "") {
      throw new ValidationError("Refresh token is required", {
        refreshToken: "Refresh token is required",
      });
    }

    // Remove refresh token from database (Requirement 5.1)
    // This is idempotent - if token doesn't exist, it's still a success (Requirement 5.3)
    await tokenService.removeRefreshToken(refreshToken);
  },

  /**
   * Refresh access token using a valid refresh token
   * @param refreshToken - The refresh token to use for generating new tokens
   * @returns New auth tokens (accessToken, refreshToken, expiresIn)
   * @throws AuthenticationError if refresh token is invalid, expired, or not in database
   *
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    // Check if refresh token is provided
    if (!refreshToken || refreshToken.trim() === "") {
      throw new AuthenticationError("Invalid refresh token");
    }

    // Verify refresh token (Requirements 4.2, 4.4)
    let payload;
    try {
      payload = tokenService.verifyRefreshToken(refreshToken);
    } catch (error) {
      if (error instanceof TokenError) {
        if (error.code === "EXPIRED_TOKEN") {
          throw new AuthenticationError("Refresh token has expired");
        }
        throw new AuthenticationError("Invalid refresh token");
      }
      throw new AuthenticationError("Invalid refresh token");
    }

    // Validate refresh token exists in database (Requirement 4.3)
    const isValidInDb = await tokenService.validateStoredRefreshToken(payload.userId, refreshToken);
    if (!isValidInDb) {
      throw new AuthenticationError("Invalid refresh token");
    }

    // Get user to ensure they still exist and get current role
    const user = await User.findById(payload.userId);
    if (!user) {
      throw new AuthenticationError("Invalid refresh token");
    }

    // Get user's role name
    const role = await Role.findById(user.role_id);
    const roleName = role?.name || DEFAULT_ROLE;

    // Generate new access token (Requirement 4.1)
    const newAccessToken = tokenService.generateAccessToken({
      userId: payload.userId,
      role: roleName,
      email: user.email,
      name: user.full_name,
    });

    // Generate new refresh token (token rotation for security)
    const newRefreshToken = tokenService.generateRefreshToken({
      userId: payload.userId,
      role: roleName,
      email: user.email,
      name: user.full_name,
    });

    // Remove old refresh token and store new one
    await tokenService.removeRefreshToken(refreshToken);
    await tokenService.storeRefreshToken(payload.userId, newRefreshToken);

    // Calculate expiration time in seconds
    const expiresIn = parseDurationToSeconds(config.jwt.expiresIn);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn,
    };
  },

  /**
   * Get current user by ID
   * @param userId - The user ID to look up
   * @returns User response without password
   * @throws NotFoundError if user is not found
   */
  async getCurrentUser(userId: string): Promise<UserResponse> {
    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new NotFoundError("User not found");
    }

    // Find user by ID and populate role
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Get user's role name
    const role = await Role.findById(user.role_id);
    const roleName = role?.name || DEFAULT_ROLE;

    // Return user data without password
    const userResponse: UserResponse = {
      id: (user._id as mongoose.Types.ObjectId).toString(),
      email: user.email,
      full_name: user.full_name,
      role: roleName,
      is_verified: user.is_verified,
      createdAt: user.createdAt,
    };

    return userResponse;
  },

  /**
   * Verify user email using OTP
   * @param email - User's email address
   * @param otp - OTP code sent to email
   * @throws ValidationError if email or OTP is missing
   * @throws AuthenticationError if OTP is invalid or expired
   * @throws NotFoundError if user is not found
   */
  async verifyEmail(email: string, otp: string): Promise<void> {
    if (!email || email.trim() === "") {
      throw new ValidationError("Email is required", {
        email: "Email is required",
      });
    }

    if (!otp || otp.trim() === "") {
      throw new ValidationError("OTP is required", {
        otp: "OTP is required",
      });
    }

    // Verify OTP from Redis
    const isValidOtp = await otpService.verifyOTP(email, otp);
    if (!isValidOtp) {
      throw new AuthenticationError("Invalid or expired OTP");
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (user.is_verified) {
      // Already verified, delete OTP and return (idempotent)
      await otpService.deleteOTP(email);
      return;
    }

    // Mark user as verified
    user.is_verified = true;
    await user.save();

    // Delete OTP from Redis after successful verification
    await otpService.deleteOTP(email);
  },

  /**
   * Send forgot password OTP to user's email
   * @param email - User's email address
   * @throws ValidationError if email is missing or invalid format
   * @throws NotFoundError if user is not found
   */
  async forgotPassword(email: string): Promise<void> {
    if (!email || email.trim() === "") {
      throw new ValidationError("Email is required", {
        email: "Email is required",
      });
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      throw new ValidationError("Invalid email format", { email: "Invalid email format" });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new NotFoundError("User not found with this email address");
    }

    // Generate OTP and store in Redis (10 minutes expiry)
    const otp = await otpService.generateOTP(user.email);

    // Send forgot password OTP email (non-blocking)
    emailService.sendForgotPasswordOTP(user.email, otp, user.full_name).catch((error) => {
      console.error("Failed to send forgot password OTP email:", error);
    });
  },

  /**
   * Reset user password using OTP verification
   * @param email - User's email address
   * @param otp - OTP code sent to email
   * @param newPassword - New password to set
   * @throws ValidationError if email, OTP, or password is missing/invalid
   * @throws AuthenticationError if OTP is invalid or expired
   * @throws NotFoundError if user is not found
   */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    if (!email || email.trim() === "") {
      throw new ValidationError("Email is required", {
        email: "Email is required",
      });
    }

    if (!otp || otp.trim() === "") {
      throw new ValidationError("OTP is required", {
        otp: "OTP is required",
      });
    }

    if (!newPassword || newPassword === "") {
      throw new ValidationError("New password is required", {
        newPassword: "New password is required",
      });
    }

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      throw new ValidationError("Invalid email format", { email: "Invalid email format" });
    }

    // Validate password length
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError("Password must be at least 8 characters", {
        newPassword: "Password must be at least 8 characters",
      });
    }

    // Verify OTP from Redis
    const isValidOtp = await otpService.verifyOTP(email, otp);
    if (!isValidOtp) {
      throw new AuthenticationError("Invalid or expired OTP");
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Hash new password
    const passwordHash = await passwordService.hash(newPassword);

    // Update user's password
    user.password_hash = passwordHash;
    await user.save();

    // Delete OTP from Redis after successful password reset
    await otpService.deleteOTP(email);
  },
};

export default authService;
