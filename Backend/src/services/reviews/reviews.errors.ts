export class ReviewError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ReviewError";
  }
}

export class ReviewValidationError extends ReviewError {
  constructor(
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ReviewValidationError";
  }
}

export class ReviewNotFoundError extends ReviewError {
  constructor(message: string = "Review not found") {
    super(message, "NOT_FOUND_ERROR", 404);
    this.name = "ReviewNotFoundError";
  }
}

export class ReviewForbiddenError extends ReviewError {
  constructor(message: string = "You do not have permission") {
    super(message, "FORBIDDEN_ERROR", 403);
    this.name = "ReviewForbiddenError";
  }
}
