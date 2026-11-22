export class PublicTripError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "PublicTripError";
  }
}

export class PublicTripNotFoundError extends PublicTripError {
  constructor(message: string = "Trip not found") {
    super(message, "NOT_FOUND_ERROR", 404);
    this.name = "PublicTripNotFoundError";
  }
}
