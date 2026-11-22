export class SupportError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "SupportError";
  }
}

export class SupportValidationError extends SupportError {
  constructor(
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "SupportValidationError";
  }
}
