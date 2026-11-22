export class TripContentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "TripContentError";
  }
}

export class TripContentValidationError extends TripContentError {
  constructor(
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "TripContentValidationError";
  }
}

export class TripContentNotFoundError extends TripContentError {
  constructor(message: string = "Resource not found") {
    super(message, "NOT_FOUND_ERROR", 404);
    this.name = "TripContentNotFoundError";
  }
}

export class TripContentForbiddenError extends TripContentError {
  constructor(message: string = "You do not have permission") {
    super(message, "FORBIDDEN_ERROR", 403);
    this.name = "TripContentForbiddenError";
  }
}
