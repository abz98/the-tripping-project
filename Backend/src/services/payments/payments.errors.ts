export class PaymentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

export class PaymentValidationError extends PaymentError {
  constructor(
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "PaymentValidationError";
  }
}

export class PaymentNotFoundError extends PaymentError {
  constructor(message: string = "Payment not found") {
    super(message, "NOT_FOUND_ERROR", 404);
    this.name = "PaymentNotFoundError";
  }
}

export class PaymentForbiddenError extends PaymentError {
  constructor(message: string = "You do not have permission") {
    super(message, "FORBIDDEN_ERROR", 403);
    this.name = "PaymentForbiddenError";
  }
}
