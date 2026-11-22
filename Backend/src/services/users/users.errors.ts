/**
 * Custom error classes for User Service
 */

export class UserError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "UserError";
  }
}

export class UserValidationError extends UserError {
  constructor(
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "UserValidationError";
  }
}

export class UserNotFoundError extends UserError {
  constructor(message: string = "User not found") {
    super(message, "NOT_FOUND_ERROR", 404);
    this.name = "UserNotFoundError";
  }
}

export class UserAuthenticationError extends UserError {
  constructor(message: string = "Authentication failed") {
    super(message, "AUTHENTICATION_ERROR", 401);
    this.name = "UserAuthenticationError";
  }
}
