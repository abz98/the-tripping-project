/**
 * Admin Payment Routes
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/rbac.middleware.js";
import { HTTP_STATUS } from "../../../constants/statusCodes.js";
import { MESSAGES } from "../../../constants/messages.js";

const router = Router();

// Get All Payments (Admin)
router.get(
  "/admin/payments",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { Payment } = await import("../../../models/payments/payment.model.js");
      const { Booking } = await import("../../../models/bookings/booking.model.js");
      const { Trip } = await import("../../../models/trips/trips.model.js");
      const { User } = await import("../../../models/users/users.model.js");

      // Get query parameters
      const status = req.query.status as string;
      const gateway = req.query.gateway as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};

      if (status) {
        query.status = status;
      }

      if (gateway) {
        query.gateway = gateway;
      }

      // Get payments with pagination
      const [payments, total] = await Promise.all([
        Payment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Payment.countDocuments(query),
      ]);

      // Get all unique IDs
      const bookingIds = [...new Set(payments.map((p: any) => p.booking_id.toString()))];
      const userIds = [...new Set(payments.map((p: any) => p.user_id.toString()))];

      // Fetch all related data
      const [bookings, users] = await Promise.all([
        Booking.find({ _id: { $in: bookingIds } }).select("trip_id num_travelers"),
        User.find({ _id: { $in: userIds } }).select("full_name email phone"),
      ]);

      // Get trip IDs from bookings
      const tripIds = [...new Set(bookings.map((b: any) => b.trip_id.toString()))];
      const trips = await Trip.find({ _id: { $in: tripIds } }).select("title slug");

      // Create maps for quick lookup
      const bookingMap = new Map(bookings.map((b: any) => [b._id.toString(), b]));
      const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));
      const tripMap = new Map(trips.map((t: any) => [t._id.toString(), t]));

      const formattedPayments = payments.map((payment: any) => {
        const booking = bookingMap.get(payment.booking_id.toString());
        const user = userMap.get(payment.user_id.toString());
        const trip = booking ? tripMap.get(booking.trip_id.toString()) : null;

        return {
          id: payment._id.toString(),
          user: user
            ? {
                id: user._id.toString(),
                name: user.full_name,
                email: user.email,
                phone: user.phone,
              }
            : null,
          booking: booking
            ? {
                id: booking._id.toString(),
                num_travelers: booking.num_travelers,
              }
            : null,
          trip: trip
            ? {
                id: trip._id.toString(),
                title: trip.title,
                slug: trip.slug,
              }
            : null,
          amount: payment.amount,
          currency: payment.currency,
          gateway: payment.gateway,
          gateway_payment_id: payment.gateway_payment_id,
          gateway_order_id: payment.gateway_order_id,
          status: payment.status,
          metadata: payment.metadata,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        };
      });

      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.FETCHED,
        data: formattedPayments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + payments.length < total,
        },
      });
    } catch (error: any) {
      console.error("Get all payments error:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: error.message || MESSAGES.ERROR.INTERNAL_SERVER,
        error: { code: "INTERNAL_ERROR" },
      });
    }
  },
);

export default router;
