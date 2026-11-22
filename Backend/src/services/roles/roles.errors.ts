/**
 * Custom error classes for Role Service
 */

export class RoleError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "RoleError";
  }
}

export class RoleValidationError extends RoleError {
  constructor(
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "RoleValidationError";
  }
}

export class RoleNotFoundError extends RoleError {
  constructor(message: string = "Role not found") {
    super(message, "NOT_FOUND_ERROR", 404);
    this.name = "RoleNotFoundError";
  }
}

export class RoleConflictError extends RoleError {
  constructor(message: string = "Role already exists") {
    super(message, "CONFLICT_ERROR", 409);
    this.name = "RoleConflictError";
  }
}
