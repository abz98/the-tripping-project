export class TripError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "TripError";
  }
}

export class TripValidationError extends TripError {
  constructor(
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "TripValidationError";
  }
}

export class TripNotFoundError extends TripError {
  constructor(message: string = "Trip not found") {
    super(message, "NOT_FOUND_ERROR", 404);
    this.name = "TripNotFoundError";
  }
}

export class TripForbiddenError extends TripError {
  constructor(message: string = "You do not have permission to access this trip") {
    super(message, "FORBIDDEN_ERROR", 403);
    this.name = "TripForbiddenError";
  }
}
