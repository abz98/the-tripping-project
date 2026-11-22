/**
 * Custom error classes for Auth Service
 *
 * Requirements:
 * - 1.2: Reject registration if email already exists with conflict error
 * - 1.4: Reject if missing required fields with validation error
 * - 1.5: Reject if invalid email format with validation error
 * - 1.6: Reject if password shorter than 8 characters with validation error
 */

/**
 * Base class for auth-related errors
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Validation error for invalid input data
 * Used for missing required fields, invalid email format, password too short
 */
export class ValidationError extends AuthError {
  constructor(
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

/**
 * Conflict error for duplicate resources
 * Used when email already exists during registration
 */
export class ConflictError extends AuthError {
  constructor(message: string) {
    super(message, "CONFLICT_ERROR", 409);
    this.name = "ConflictError";
  }
}

/**
 * Authentication error for invalid credentials
 * Used for login failures
 */
export class AuthenticationError extends AuthError {
  constructor(message: string = "Invalid email or password") {
    super(message, "AUTHENTICATION_ERROR", 401);
    this.name = "AuthenticationError";
  }
}

/**
 * Not found error for missing resources
 * Used when user or role is not found
 */
export class NotFoundError extends AuthError {
  constructor(message: string) {
    super(message, "NOT_FOUND_ERROR", 404);
    this.name = "NotFoundError";
  }
}
