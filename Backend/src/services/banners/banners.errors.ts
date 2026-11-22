export class BannerError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "BannerError";
  }
}

export class BannerValidationError extends BannerError {
  constructor(
    message: string,
    public readonly details?: Record<string, string>,
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "BannerValidationError";
  }
}

export class BannerNotFoundError extends BannerError {
  constructor(message: string = "Banner not found") {
    super(message, "NOT_FOUND_ERROR", 404);
    this.name = "BannerNotFoundError";
  }
}
