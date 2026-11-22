/**
 * City Service Errors
 */

import { HTTP_STATUS } from "../../constants/statusCodes.js";

export class CityError extends Error {
  constructor(
    message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    public code: string = "CITY_ERROR",
  ) {
    super(message);
    this.name = "CityError";
  }
}

export class CityValidationError extends CityError {
  constructor(
    message: string,
    public details?: Record<string, string>,
  ) {
    super(message, HTTP_STATUS.BAD_REQUEST, "VALIDATION_ERROR");
    this.name = "CityValidationError";
  }
}

export class CityNotFoundError extends CityError {
  constructor(message: string = "City not found") {
    super(message, HTTP_STATUS.NOT_FOUND, "NOT_FOUND_ERROR");
    this.name = "CityNotFoundError";
  }
}
