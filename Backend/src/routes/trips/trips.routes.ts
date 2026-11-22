/**
 * Public Trip Routes
 */

import { Router, Request, Response } from "express";
import { publicTripsService } from "../../services/publicTrips/publicTrips.service.js";
import {
  PublicTripError,
  PublicTripNotFoundError,
} from "../../services/publicTrips/publicTrips.errors.js";
import { HTTP_STATUS } from "../../constants/statusCodes.js";
import { MESSAGES } from "../../constants/messages.js";

const router = Router();

function handleError(error: unknown, res: Response): void {
  if (error instanceof PublicTripNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof PublicTripError) {
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

// List Trips
router.get("/trips", async (req: Request, res: Response) => {
  try {
    const query = {
      search: req.query.search as string,
      category: req.query.category as string,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      duration: req.query.duration ? Number(req.query.duration) : undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10,
    };

    const result = await publicTripsService.listTrips(query);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      ...result,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Trip Details
router.get("/trips/:slug", async (req: Request, res: Response) => {
  try {
    const trip = await publicTripsService.getTripBySlug(req.params.slug);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: trip,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Trip Reviews
router.get("/trips/:id/reviews", async (req: Request, res: Response) => {
  try {
    const reviews = await publicTripsService.getTripReviews(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: reviews,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Trip Batches
router.get("/trips/:id/batches", async (req: Request, res: Response) => {
  try {
    const batches = await publicTripsService.getTripBatches(req.params.id);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: batches,
    });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
