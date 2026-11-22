export class ModerationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ModerationError";
  }
}

export class ModerationValidationError extends ModerationError {
  constructor(
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ModerationValidationError";
  }
}

export class ModerationNotFoundError extends ModerationError {
  constructor(message: string = "Trip not found") {
    super(message, "NOT_FOUND_ERROR", 404);
    this.name = "ModerationNotFoundError";
  }
}
