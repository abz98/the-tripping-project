/**
 * Trip Admin Routes - Moderation
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/rbac.middleware.js";
import { tripModerationService } from "../../../services/tripModeration/tripModeration.service.js";
import {
  ModerationError,
  ModerationValidationError,
  ModerationNotFoundError,
} from "../../../services/tripModeration/tripModeration.errors.js";
import { HTTP_STATUS } from "../../../constants/statusCodes.js";
import { MESSAGES } from "../../../constants/messages.js";

const router = Router();

interface AuthenticatedRequest extends Request {
  user: { userId: string; role: string; email: string; name: string };
}

function handleModerationError(error: unknown, res: Response): void {
  if (error instanceof ModerationValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: "error",
      message: error.message,
      error: { code: error.code, details: error.details },
    });
    return;
  }

  if (error instanceof ModerationNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof ModerationError) {
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

// Get Pending Trips
router.get(
  "/admin/trips/pending",
  authenticate,
  authorize("ADMIN"),
  async (_req: Request, res: Response) => {
    try {
      const trips = await tripModerationService.getPendingTrips();
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.FETCHED,
        data: trips,
      });
    } catch (error) {
      handleModerationError(error, res);
    }
  },
);

// Get All Trips (Admin)
router.get(
  "/admin/trips",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { Trip } = await import("../../../models/trips/trips.model.js");
      const { User } = await import("../../../models/users/users.model.js");

      // Get query parameters for filtering
      const status = req.query.status as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = { is_deleted: false };
      if (status) {
        query.status = status;
      }

      // Get trips with pagination
      const [trips, total] = await Promise.all([
        Trip.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Trip.countDocuments(query),
      ]);

      // Get all unique host IDs
      const hostIds = [...new Set(trips.map((trip: any) => trip.host_id.toString()))];

      // Fetch all hosts
      const hosts = await User.find({ _id: { $in: hostIds } }).select("full_name email phone");
      const hostMap = new Map(hosts.map((h: any) => [h._id.toString(), h]));

      const formattedTrips = trips.map((trip: any) => {
        const host = hostMap.get(trip.host_id.toString());
        return {
          id: trip._id.toString(),
          title: trip.title,
          slug: trip.slug,
          destination: trip.destination,
          base_price: trip.base_price,
          duration_days: trip.duration_days,
          duration_nights: trip.duration_nights,
          status: trip.status,
          is_featured: trip.is_featured,
          createdAt: trip.createdAt,
          updatedAt: trip.updatedAt,
          host: host
            ? {
                id: host._id.toString(),
                name: host.full_name,
                email: host.email,
                phone: host.phone,
              }
            : null,
        };
      });

      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.FETCHED,
        data: formattedTrips,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + trips.length < total,
        },
      });
    } catch (error: any) {
      console.error("Get all trips error:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: error.message || MESSAGES.ERROR.INTERNAL_SERVER,
        error: { code: "INTERNAL_ERROR" },
      });
    }
  },
);

// Review Trip
router.post(
  "/admin/trips/:id/review",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const moderation = await tripModerationService.reviewTrip(req.params.id, userId, req.body);
      res.status(HTTP_STATUS.CREATED).json({
        status: "success",
        message: MESSAGES.SUCCESS.CREATED,
        data: moderation,
      });
    } catch (error) {
      handleModerationError(error, res);
    }
  },
);

// Moderation History
router.get(
  "/admin/trips/:id/moderations",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const history = await tripModerationService.getModerationHistory(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.FETCHED,
        data: history,
      });
    } catch (error) {
      handleModerationError(error, res);
    }
  },
);

// Join Trip Chat (Admin)
router.post(
  "/admin/trips/:id/chat/join",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const adminId = (req as any).user.userId;
      const adminName = (req as any).user.name;
      const tripId = req.params.id;

      const { paymentChatIntegrationService } =
        await import("../../../services/chat/payment-integration.service.js");

      await paymentChatIntegrationService.addAdminToChat(tripId, adminId, adminName);

      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: "Successfully joined trip chat",
      });
    } catch (error: any) {
      console.error("Admin join chat error:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: error.message || "Failed to join trip chat",
        error: { code: "INTERNAL_ERROR" },
      });
    }
  },
);

// Update Trip Status (Admin)
router.patch(
  "/admin/trips/:id/status",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const { Trip } = await import("../../../models/trips/trips.model.js");
      const tripId = req.params.id;
      const { status } = req.body;

      // Validate status
      const validStatuses = ["REJECTED", "PUBLISHED", "ARCHIVED", "PENDING_APPROVAL"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: "error",
          message: "Invalid status",
          error: {
            code: "VALIDATION_ERROR",
            details: {
              status: `Status must be one of: ${validStatuses.join(", ")}`,
            },
          },
        });
      }

      // Find and update trip
      const trip = await Trip.findOne({ _id: tripId, is_deleted: false });
      if (!trip) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          status: "error",
          message: "Trip not found",
          error: { code: "TRIP_NOT_FOUND" },
        });
      }

      const oldStatus = trip.status;
      trip.status = status;
      await trip.save();

      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: "Trip status updated successfully",
        data: {
          id: trip._id.toString(),
          title: trip.title,
          oldStatus,
          newStatus: status,
          updatedAt: trip.updatedAt,
        },
      });
    } catch (error: any) {
      console.error("Update trip status error:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: error.message || MESSAGES.ERROR.INTERNAL_SERVER,
        error: { code: "INTERNAL_ERROR" },
      });
    }
  },
);

export default router;
