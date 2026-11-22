/**
 * Auth Request Validators
 * Provides validation functions for authentication endpoints
 *
 * Requirements:
 * - 1.4: Reject if missing required fields with validation error
 * - 1.5: Reject if invalid email format with validation error
 * - 1.6: Reject if password shorter than 8 characters with validation error
 */

import { VALID_ROLES, RoleName } from "../constants/roles.js";

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result structure
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Register request body interface
 */
export interface RegisterRequestBody {
  email?: string;
  password?: string;
  full_name?: string;
  role?: string;
}

/**
 * Login request body interface
 */
export interface LoginRequestBody {
  email?: string;
  password?: string;
}

/**
 * Refresh token request body interface
 */
export interface RefreshRequestBody {
  refreshToken?: string;
}

/**
 * Logout request body interface
 */
export interface LogoutRequestBody {
  refreshToken?: string;
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
 * Validate email format
 * @param email - Email string to validate
 * @returns true if email is valid, false otherwise
 */
function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate password length
 * @param password - Password string to validate
 * @returns true if password meets minimum length, false otherwise
 */
function isValidPassword(password: string): boolean {
  return password.length >= MIN_PASSWORD_LENGTH;
}

/**
 * Validate role value
 * @param role - Role string to validate
 * @returns true if role is valid, false otherwise
 */
function isValidRole(role: string): boolean {
  return VALID_ROLES.includes(role as RoleName);
}

/**
 * Validate registration request body
 * Validates email, password, full_name, and optional role fields
 *
 * @param body - Registration request body
 * @returns ValidationResult with isValid flag and errors array
 *
 * Requirements: 1.4, 1.5, 1.6
 */
export function validateRegister(body: RegisterRequestBody): ValidationResult {
  const errors: ValidationError[] = [];

  // Check required fields (Requirement 1.4)
  if (!body.email || body.email.trim() === "") {
    errors.push({
      field: "email",
      message: "Email is required",
    });
  } else if (!isValidEmail(body.email)) {
    // Validate email format (Requirement 1.5)
    errors.push({
      field: "email",
      message: "Invalid email format",
    });
  }

  if (!body.password || body.password === "") {
    errors.push({
      field: "password",
      message: "Password is required",
    });
  } else if (!isValidPassword(body.password)) {
    // Validate password length (Requirement 1.6)
    errors.push({
      field: "password",
      message: "Password must be at least 8 characters",
    });
  }

  if (!body.full_name || body.full_name.trim() === "") {
    errors.push({
      field: "full_name",
      message: "Full name is required",
    });
  }

  // Validate role if provided (optional field)
  if (body.role !== undefined && body.role !== null && body.role !== "") {
    if (!isValidRole(body.role)) {
      errors.push({
        field: "role",
        message: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate login request body
 * Validates email and password fields
 *
 * @param body - Login request body
 * @returns ValidationResult with isValid flag and errors array
 */
export function validateLogin(body: LoginRequestBody): ValidationResult {
  const errors: ValidationError[] = [];

  // Check required fields
  if (!body.email || body.email.trim() === "") {
    errors.push({
      field: "email",
      message: "Email is required",
    });
  } else if (!isValidEmail(body.email)) {
    errors.push({
      field: "email",
      message: "Invalid email format",
    });
  }

  if (!body.password || body.password === "") {
    errors.push({
      field: "password",
      message: "Password is required",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate refresh token request body
 * Validates refreshToken field
 *
 * @param body - Refresh request body
 * @returns ValidationResult with isValid flag and errors array
 */
export function validateRefresh(body: RefreshRequestBody): ValidationResult {
  const errors: ValidationError[] = [];

  if (!body.refreshToken || body.refreshToken.trim() === "") {
    errors.push({
      field: "refreshToken",
      message: "Refresh token is required",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate logout request body
 * Validates refreshToken field
 *
 * @param body - Logout request body
 * @returns ValidationResult with isValid flag and errors array
 */
export function validateLogout(body: LogoutRequestBody): ValidationResult {
  const errors: ValidationError[] = [];

  if (!body.refreshToken || body.refreshToken.trim() === "") {
    errors.push({
      field: "refreshToken",
      message: "Refresh token is required",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export default {
  validateRegister,
  validateLogin,
  validateRefresh,
  validateLogout,
};
