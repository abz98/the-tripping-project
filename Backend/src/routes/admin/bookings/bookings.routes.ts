/**
 * Admin Booking Routes
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/rbac.middleware.js";
import { HTTP_STATUS } from "../../../constants/statusCodes.js";
import { MESSAGES } from "../../../constants/messages.js";

const router = Router();

// Get All Bookings (Admin)
router.get(
  "/admin/bookings",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { Booking } = await import("../../../models/bookings/booking.model.js");
      const { Trip } = await import("../../../models/trips/trips.model.js");
      const { TripBatch } = await import("../../../models/tripBatch/tripBatch.model.js");
      const { User } = await import("../../../models/users/users.model.js");

      // Get query parameters
      const status = req.query.status as string;
      const payment_status = req.query.payment_status as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};

      if (status) {
        query.status = status;
      }

      if (payment_status) {
        query.payment_status = payment_status;
      }

      // Get bookings with pagination
      const [bookings, total] = await Promise.all([
        Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Booking.countDocuments(query),
      ]);

      // Get all unique IDs
      const tripIds = [...new Set(bookings.map((b: any) => b.trip_id.toString()))];
      const batchIds = [...new Set(bookings.map((b: any) => b.batch_id.toString()))];
      const userIds = [...new Set(bookings.map((b: any) => b.user_id.toString()))];

      // Fetch all related data
      const [trips, batches, users] = await Promise.all([
        Trip.find({ _id: { $in: tripIds } }).select("title slug host_id"),
        TripBatch.find({ _id: { $in: batchIds } }).select("start_date end_date price_override"),
        User.find({ _id: { $in: userIds } }).select("full_name email phone"),
      ]);

      // Create maps for quick lookup
      const tripMap = new Map(trips.map((t: any) => [t._id.toString(), t]));
      const batchMap = new Map(batches.map((b: any) => [b._id.toString(), b]));
      const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

      // Get host IDs and fetch host details
      const hostIds = [...new Set(trips.map((t: any) => t.host_id?.toString()).filter(Boolean))];
      const hosts = await User.find({ _id: { $in: hostIds } }).select("full_name email");
      const hostMap = new Map(hosts.map((h: any) => [h._id.toString(), h]));

      const formattedBookings = bookings.map((booking: any) => {
        const trip = tripMap.get(booking.trip_id.toString());
        const batch = batchMap.get(booking.batch_id.toString());
        const user = userMap.get(booking.user_id.toString());
        const host = trip?.host_id ? hostMap.get(trip.host_id.toString()) : null;

        return {
          id: booking._id.toString(),
          user: user
            ? {
                id: user._id.toString(),
                name: user.full_name,
                email: user.email,
                phone: user.phone,
              }
            : null,
          trip: trip
            ? {
                id: trip._id.toString(),
                title: trip.title,
                slug: trip.slug,
              }
            : null,
          host: host
            ? {
                id: host._id.toString(),
                name: host.full_name,
                email: host.email,
              }
            : null,
          batch: batch
            ? {
                id: batch._id.toString(),
                start_date: batch.start_date,
                end_date: batch.end_date,
              }
            : null,
          num_travelers: booking.num_travelers,
          pickup_location: booking.pickup_location,
          total_amount: booking.total_amount,
          status: booking.status,
          payment_status: booking.payment_status,
          cancellation_reason: booking.cancellation_reason,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt,
        };
      });

      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.FETCHED,
        data: formattedBookings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + bookings.length < total,
        },
      });
    } catch (error: any) {
      console.error("Get all bookings error:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: error.message || MESSAGES.ERROR.INTERNAL_SERVER,
        error: { code: "INTERNAL_ERROR" },
      });
    }
  },
);

export default router;
