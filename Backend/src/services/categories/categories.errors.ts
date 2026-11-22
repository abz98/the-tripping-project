export class CategoryError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "CategoryError";
  }
}

export class CategoryValidationError extends CategoryError {
  constructor(
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "CategoryValidationError";
  }
}

export class CategoryNotFoundError extends CategoryError {
  constructor(message: string = "Category not found") {
    super(message, "NOT_FOUND_ERROR", 404);
    this.name = "CategoryNotFoundError";
  }
}
