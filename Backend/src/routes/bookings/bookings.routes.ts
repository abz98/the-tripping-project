/**
 * Booking Routes
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { bookingService } from "../../services/bookings/bookings.service.js";
import {
  BookingError,
  BookingValidationError,
  BookingNotFoundError,
  BookingForbiddenError,
} from "../../services/bookings/bookings.errors.js";
import { HTTP_STATUS } from "../../constants/statusCodes.js";
import { MESSAGES } from "../../constants/messages.js";

const router = Router();

interface AuthenticatedRequest extends Request {
  user: { userId: string; role: string };
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof BookingValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: "error",
      message: error.message,
      error: { code: error.code, details: error.details },
    });
    return;
  }

  if (error instanceof BookingNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof BookingForbiddenError) {
    res.status(HTTP_STATUS.FORBIDDEN).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof BookingError) {
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

// Create Booking
router.post("/bookings", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const booking = await bookingService.create(userId, req.body);
    res.status(HTTP_STATUS.CREATED).json({
      status: "success",
      message: MESSAGES.SUCCESS.CREATED,
      data: booking,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Booking Details
router.get("/bookings/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const booking = await bookingService.getById(req.params.id, userId);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: booking,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Cancel Booking
router.patch("/bookings/:id/cancel", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const booking = await bookingService.cancel(req.params.id, userId, req.body.reason);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.UPDATED,
      data: booking,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// My Bookings
router.get("/users/me/bookings", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const bookings = await bookingService.getUserBookings(userId);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: bookings,
    });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
