export class BatchError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "BatchError";
  }
}

export class BatchValidationError extends BatchError {
  constructor(
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "BatchValidationError";
  }
}

export class BatchNotFoundError extends BatchError {
  constructor(message: string = "Batch not found") {
    super(message, "NOT_FOUND_ERROR", 404);
    this.name = "BatchNotFoundError";
  }
}

export class BatchForbiddenError extends BatchError {
  constructor(message: string = "You do not have permission to access this batch") {
    super(message, "FORBIDDEN_ERROR", 403);
    this.name = "BatchForbiddenError";
  }
}
