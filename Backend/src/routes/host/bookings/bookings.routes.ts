/**
 * Host Booking Routes
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { bookingService } from "../../../services/bookings/bookings.service.js";
import { BookingError } from "../../../services/bookings/bookings.errors.js";
import { HTTP_STATUS } from "../../../constants/statusCodes.js";
import { MESSAGES } from "../../../constants/messages.js";
import { AuthenticatedRequest } from "../../../types/express.js";

const router = Router();

function handleError(error: unknown, res: Response): void {
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

// Get all pending bookings for host's trips
router.get("/host/bookings/pending", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const bookings = await bookingService.getHostPendingBookings(userId);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: bookings,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Reject a booking request
router.post("/host/bookings/:id/reject", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const { reason } = req.body;
    const booking = await bookingService.rejectBooking(req.params.id, userId, reason);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: "Booking rejected successfully",
      data: booking,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Confirm a booking request
router.post("/host/bookings/:id/confirm", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const booking = await bookingService.confirmBooking(req.params.id, userId);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: "Booking confirmed successfully. User notified to complete payment.",
      data: booking,
    });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
