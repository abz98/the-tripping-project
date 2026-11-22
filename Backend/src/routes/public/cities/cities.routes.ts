/**
 * Public Cities Routes
 */

import { Router, Request, Response } from "express";
import { cityService } from "../../../services/cities/cities.service.js";
import {
  CityError,
  CityValidationError,
  CityNotFoundError,
} from "../../../services/cities/cities.errors.js";
import { HTTP_STATUS } from "../../../constants/statusCodes.js";
import { MESSAGES } from "../../../constants/messages.js";

const router = Router();

function handleCityError(error: unknown, res: Response): void {
  if (error instanceof CityValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: "error",
      message: error.message,
      error: { code: error.code, details: error.details },
    });
    return;
  }

  if (error instanceof CityNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof CityError) {
    res.status(error.statusCode).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    status: "error",
    message: MESSAGES.ERROR.INTERNAL_SERVER,
    error: { code: "INTERNAL_ERROR" },
  });
}

// Search cities by district
router.get("/public/cities/search/district", async (req: Request, res: Response) => {
  try {
    const { q, page, limit } = req.query;

    const result = await cityService.searchByDistrict(
      q as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 50,
    );

    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: result.cities,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    handleCityError(error, res);
  }
});

// Search cities by city name
router.get("/public/cities/search/city", async (req: Request, res: Response) => {
  try {
    const { q, page, limit } = req.query;

    const result = await cityService.searchByCity(
      q as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 50,
    );

    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: result.cities,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    handleCityError(error, res);
  }
});

// Search cities by state
router.get("/public/cities/search/state", async (req: Request, res: Response) => {
  try {
    const { q, page, limit } = req.query;

    const result = await cityService.searchByState(
      q as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 50,
    );

    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: result.cities,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    handleCityError(error, res);
  }
});

// Get all states
router.get("/public/cities/states", async (_req: Request, res: Response) => {
  try {
    const states = await cityService.getStates();

    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: states,
    });
  } catch (error) {
    handleCityError(error, res);
  }
});

// Get districts by state
router.get("/public/cities/districts", async (req: Request, res: Response) => {
  try {
    const { state } = req.query;

    const districts = await cityService.getDistrictsByState(state as string);

    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: districts,
    });
  } catch (error) {
    handleCityError(error, res);
  }
});

export default router;
