/**
 * Auth Middleware
 * Validates JWT access tokens and attaches user context to requests
 *
 * Requirements:
 * - 3.3: Auth middleware SHALL decode token and attach user context to request object
 * - 3.4: Auth middleware SHALL reject expired access tokens with unauthorized error
 * - 3.5: Auth middleware SHALL reject invalid or malformed tokens with unauthorized error
 * - 3.6: Auth middleware SHALL reject requests without Authorization header
 */

import { Request, Response, NextFunction } from "express";
import { tokenService, TokenError } from "../services/token/token.service.js";
import { HTTP_STATUS } from "../constants/statusCodes.js";
import { MESSAGES } from "../constants/messages.js";

/**
 * Extended Request interface with authenticated user context
 */
export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: string;
    email: string;
    name: string;
  };
}

/**
 * Authentication middleware
 * Extracts and validates JWT access token from Authorization header
 * Attaches user context to request object on success
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 *
 * Error responses:
 * - 401: Missing Authorization header (Requirement 3.6)
 * - 401: Invalid token format (not Bearer token)
 * - 401: Expired token (Requirement 3.4)
 * - 401: Invalid or malformed token (Requirement 3.5)
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // Check for Authorization header (Requirement 3.6)
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      status: "error",
      message: MESSAGES.AUTH.UNAUTHORIZED,
      error: { code: "AUTHENTICATION_ERROR" },
    });
    return;
  }

  // Validate Bearer token format
  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      status: "error",
      message: MESSAGES.AUTH.TOKEN_INVALID,
      error: { code: "AUTHENTICATION_ERROR" },
    });
    return;
  }

  const token = parts[1];

  // Verify token is not empty
  if (!token || token.trim() === "") {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      status: "error",
      message: MESSAGES.AUTH.TOKEN_INVALID,
      error: { code: "AUTHENTICATION_ERROR" },
    });
    return;
  }

  try {
    // Verify and decode the token (Requirements 3.3, 3.4, 3.5)
    const payload = tokenService.verifyAccessToken(token);

    // Attach user context to request (Requirement 3.3)
    (req as AuthenticatedRequest).user = {
      userId: payload.userId,
      role: payload.role,
      email: payload.email,
      name: payload.name,
    };

    next();
  } catch (error) {
    // Handle token errors (Requirements 3.4, 3.5)
    if (error instanceof TokenError) {
      let message: string;

      switch (error.code) {
        case "EXPIRED_TOKEN":
          // Requirement 3.4: Reject expired tokens
          message = MESSAGES.AUTH.TOKEN_EXPIRED;
          break;
        case "INVALID_TOKEN":
        case "MALFORMED_TOKEN":
          // Requirement 3.5: Reject invalid or malformed tokens
          message = MESSAGES.AUTH.TOKEN_INVALID;
          break;
        default:
          message = MESSAGES.AUTH.TOKEN_INVALID;
      }

      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: "error",
        message,
        error: { code: "AUTHENTICATION_ERROR" },
      });
      return;
    }

    // Handle unexpected errors
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      status: "error",
      message: MESSAGES.AUTH.TOKEN_INVALID,
      error: { code: "AUTHENTICATION_ERROR" },
    });
  }
}

export default authenticate;
