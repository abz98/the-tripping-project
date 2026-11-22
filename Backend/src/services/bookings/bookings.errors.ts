export class BookingError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "BookingError";
  }
}

export class BookingValidationError extends BookingError {
  constructor(
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "BookingValidationError";
  }
}

export class BookingNotFoundError extends BookingError {
  constructor(message: string = "Booking not found") {
    super(message, "NOT_FOUND_ERROR", 404);
    this.name = "BookingNotFoundError";
  }
}

export class BookingForbiddenError extends BookingError {
  constructor(message: string = "You do not have permission") {
    super(message, "FORBIDDEN_ERROR", 403);
    this.name = "BookingForbiddenError";
  }
}
