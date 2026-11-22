/**
 * Token Service
 * Manages JWT token operations for access and refresh tokens
 *
 * Requirements:
 * - 3.1: Access token SHALL include user_id, role, and expiration time, signed with JWT_SECRET
 * - 3.2: Refresh token SHALL include user_id and expiration time, signed with JWT_REFRESH_SECRET
 * - 3.7: Encoding to JWT then decoding SHALL produce equivalent user context (round-trip)
 * - 8.1: Store refresh token with user_id, token value, expiration date, and creation timestamp
 * - 8.2: Verify token exists in database before generating new access token
 * - 8.3: Delete associated refresh token from database on logout
 */

import jwt from "jsonwebtoken";
const { JsonWebTokenError, TokenExpiredError } = jwt;
import mongoose from "mongoose";
import { config } from "../../config/env.config.js";
import { RefreshToken } from "../../models/refresh-tokens/refresh-token.model.js";

/**
 * Token payload interface
 * Contains the data embedded in JWT tokens
 */
export interface TokenPayload {
  userId: string;
  role: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

/**
 * Email verification token payload
 */
export interface EmailVerificationPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Interface for the Token Service
 */
export interface ITokenService {
  generateAccessToken(payload: TokenPayload): string;
  generateRefreshToken(payload: TokenPayload): string;
  generateEmailVerificationToken(payload: EmailVerificationPayload): string;
  verifyAccessToken(token: string): TokenPayload;
  verifyRefreshToken(token: string): TokenPayload;
  verifyEmailVerificationToken(token: string): EmailVerificationPayload;
  storeRefreshToken(userId: string, token: string): Promise<void>;
  validateStoredRefreshToken(userId: string, token: string): Promise<boolean>;
  removeRefreshToken(token: string): Promise<void>;
  removeAllUserRefreshTokens(userId: string): Promise<void>;
}

/**
 * Custom error class for token-related errors
 */
export class TokenError extends Error {
  constructor(
    message: string,
    public readonly code: "INVALID_TOKEN" | "EXPIRED_TOKEN" | "MALFORMED_TOKEN",
  ) {
    super(message);
    this.name = "TokenError";
  }
}

/**
 * Parse duration string to seconds
 * Supports formats like "7d", "30d", "1h", "60m", "3600s"
 * @param duration - Duration string (e.g., "7d", "30d")
 * @returns Duration in seconds
 */
function parseDurationToSeconds(duration: string): number {
  const match = duration.match(/^(\d+)([dhms])$/);
  if (!match) {
    // Default to 7 days if format is invalid
    return 7 * 24 * 60 * 60;
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
      return 7 * 24 * 60 * 60;
  }
}

/**
 * Token Service implementation
 * Provides JWT token generation and verification
 */
export const tokenService: ITokenService = {
  /**
   * Generate an access token
   * @param payload - Token payload containing userId, role, email, and name
   * @returns Signed JWT access token
   *
   * Requirement 3.1: Access token includes user_id, role, email, name, and expiration time
   */
  generateAccessToken(payload: TokenPayload): string {
    const { userId, role, email, name } = payload;
    const expiresIn = parseDurationToSeconds(config.jwt.expiresIn);

    const token = jwt.sign({ userId, role, email, name }, config.jwt.secret, {
      expiresIn,
    });

    return token;
  },

  /**
   * Generate a refresh token
   * @param payload - Token payload containing userId, role, email, and name
   * @returns Signed JWT refresh token
   *
   * Requirement 3.2: Refresh token includes user_id, email, name, and expiration time
   */
  generateRefreshToken(payload: TokenPayload): string {
    const { userId, role, email, name } = payload;
    const expiresIn = parseDurationToSeconds(config.jwt.refreshExpiresIn);

    const token = jwt.sign({ userId, role, email, name }, config.jwt.refreshSecret, {
      expiresIn,
    });

    return token;
  },

  /**
   * Generate an email verification token
   * @param payload - Payload containing userId and email
   * @returns Signed JWT email verification token (expires in 24h)
   */
  generateEmailVerificationToken(payload: EmailVerificationPayload): string {
    const { userId, email } = payload;
    const expiresIn = 24 * 60 * 60; // 24 hours

    const token = jwt.sign({ userId, email, type: "email_verification" }, config.jwt.secret, {
      expiresIn,
    });

    return token;
  },

  /**
   * Verify and decode an access token
   * @param token - JWT access token to verify
   * @returns Decoded token payload
   * @throws TokenError if token is invalid, expired, or malformed
   *
   * Requirement 3.7: Decoding produces equivalent user context
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
      return {
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email,
        name: decoded.name,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new TokenError("Token has expired", "EXPIRED_TOKEN");
      }
      if (error instanceof JsonWebTokenError) {
        throw new TokenError("Invalid token", "INVALID_TOKEN");
      }
      throw new TokenError("Malformed token", "MALFORMED_TOKEN");
    }
  },

  /**
   * Verify and decode a refresh token
   * @param token - JWT refresh token to verify
   * @returns Decoded token payload
   * @throws TokenError if token is invalid, expired, or malformed
   */
  verifyRefreshToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
      return {
        userId: decoded.userId,
        role: decoded.role,
        email: decoded.email,
        name: decoded.name,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new TokenError("Refresh token has expired", "EXPIRED_TOKEN");
      }
      if (error instanceof JsonWebTokenError) {
        throw new TokenError("Invalid refresh token", "INVALID_TOKEN");
      }
      throw new TokenError("Malformed refresh token", "MALFORMED_TOKEN");
    }
  },

  /**
   * Verify and decode an email verification token
   * @param token - JWT email verification token to verify
   * @returns Decoded payload with userId and email
   * @throws TokenError if token is invalid, expired, or malformed
   */
  verifyEmailVerificationToken(token: string): EmailVerificationPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as EmailVerificationPayload & {
        type?: string;
      };
      if (decoded.type !== "email_verification") {
        throw new TokenError("Invalid token type", "INVALID_TOKEN");
      }
      return {
        userId: decoded.userId,
        email: decoded.email,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch (error) {
      if (error instanceof TokenError) {
        throw error;
      }
      if (error instanceof TokenExpiredError) {
        throw new TokenError("Verification token has expired", "EXPIRED_TOKEN");
      }
      if (error instanceof JsonWebTokenError) {
        throw new TokenError("Invalid verification token", "INVALID_TOKEN");
      }
      throw new TokenError("Malformed verification token", "MALFORMED_TOKEN");
    }
  },

  /**
   * Store a refresh token in the database
   * @param userId - User ID to associate with the token
   * @param token - Refresh token string to store
   *
   * Requirement 8.1: Store refresh token with user_id, token value, expiration date, and creation timestamp
   */
  async storeRefreshToken(userId: string, token: string): Promise<void> {
    const expiresInSeconds = parseDurationToSeconds(config.jwt.refreshExpiresIn);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    await RefreshToken.create({
      user_id: new mongoose.Types.ObjectId(userId),
      token,
      expires_at: expiresAt,
      is_revoked: false,
    });
  },

  /**
   * Validate that a refresh token exists in the database and is not revoked
   * @param userId - User ID to validate against
   * @param token - Refresh token string to validate
   * @returns True if token exists and is valid, false otherwise
   *
   * Requirement 8.2: Verify token exists in database before generating new access token
   */
  async validateStoredRefreshToken(userId: string, token: string): Promise<boolean> {
    const storedToken = await RefreshToken.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
      token,
      is_revoked: false,
      expires_at: { $gt: new Date() },
    });

    return storedToken !== null;
  },

  /**
   * Remove a specific refresh token from the database
   * @param token - Refresh token string to remove
   *
   * Requirement 8.3: Delete associated refresh token from database on logout
   */
  async removeRefreshToken(token: string): Promise<void> {
    await RefreshToken.deleteOne({ token });
  },

  /**
   * Remove all refresh tokens for a specific user
   * @param userId - User ID whose tokens should be removed
   *
   * Useful for "logout from all devices" functionality
   */
  async removeAllUserRefreshTokens(userId: string): Promise<void> {
    await RefreshToken.deleteMany({
      user_id: new mongoose.Types.ObjectId(userId),
    });
  },
};

export default tokenService;
