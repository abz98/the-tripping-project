/**
 * Trip Moderation Service
 */

import mongoose from "mongoose";
import { Trip } from "../../models/trips/trips.model.js";
import { TripModeration } from "../../models/tripModeration/tripModeration.model.js";
import { Host } from "../../models/hosts/host.model.js";
import { User } from "../../models/users/users.model.js";
import { emailService } from "../email/email.service.js";
import { ModerationValidationError, ModerationNotFoundError } from "./tripModeration.errors.js";

type ModerationStatus = "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";

export interface ReviewTripDTO {
  status: ModerationStatus;
  reasons: string[];
  admin_message?: string;
}

export interface PendingTripResponse {
  id: string;
  host_id: string;
  title: string;
  slug: string;
  description: string;
  duration_days: number;
  duration_nights: number;
  base_price: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModerationResponse {
  id: string;
  trip_id: string;
  admin_id: string;
  status: ModerationStatus;
  reasons: string[];
  admin_message?: string;
  createdAt: Date;
}

const VALID_STATUSES: ModerationStatus[] = ["APPROVED", "CHANGES_REQUESTED", "REJECTED"];

function toTripResponse(trip: any): PendingTripResponse {
  return {
    id: (trip._id as mongoose.Types.ObjectId).toString(),
    host_id: trip.host_id.toString(),
    title: trip.title,
    slug: trip.slug,
    description: trip.description,
    duration_days: trip.duration_days,
    duration_nights: trip.duration_nights,
    base_price: trip.base_price,
    status: trip.status,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
  };
}

function toModerationResponse(mod: any): ModerationResponse {
  return {
    id: (mod._id as mongoose.Types.ObjectId).toString(),
    trip_id: mod.trip_id.toString(),
    admin_id: mod.admin_id.toString(),
    status: mod.status,
    reasons: mod.reasons,
    admin_message: mod.admin_message,
    createdAt: mod.createdAt,
  };
}

export const tripModerationService = {
  async getPendingTrips(): Promise<any[]> {
    const trips = await Trip.aggregate([
      {
        $match: {
          status: "PENDING_APPROVAL",
          is_deleted: false,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "host_id",
          foreignField: "_id",
          as: "host",
        },
      },
      {
        $unwind: {
          path: "$host",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          id: "$_id",
          tripName: "$title",
          destination: 1,
          base_price: 1,
          duration_days: 1,
          duration_nights: 1,
          status: 1,
          createdAt: 1,
          hostDetails: {
            id: "$host._id",
            name: "$host.full_name",
            email: "$host.email",
          },
          _id: 0,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    return trips;
  },

  async reviewTrip(
    tripId: string,
    adminId: string,
    data: ReviewTripDTO,
  ): Promise<ModerationResponse> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      throw new ModerationNotFoundError();
    }

    const errors: Record<string, string> = {};

    if (!data.status) {
      errors.status = "Status is required";
    } else if (!VALID_STATUSES.includes(data.status)) {
      errors.status = `Status must be one of: ${VALID_STATUSES.join(", ")}`;
    }

    if (!data.reasons || !Array.isArray(data.reasons) || data.reasons.length === 0) {
      errors.reasons = "At least one reason is required";
    }

    if (Object.keys(errors).length > 0) {
      throw new ModerationValidationError("Validation failed", errors);
    }

    const trip = await Trip.findOne({ _id: tripId, is_deleted: false });
    if (!trip) {
      throw new ModerationNotFoundError();
    }

    // Get host and user details for email
    let hostEmail = "";
    let hostName = "";
    const user = await User.findById(trip.host_id);
    if (user) {
      hostEmail = user.email;
      hostName = user.full_name;
    }

    // Update trip status based on moderation decision
    if (data.status === "APPROVED") {
      trip.status = "PUBLISHED";
    } else if (data.status === "CHANGES_REQUESTED") {
      trip.status = "CHANGES_REQUESTED";
    } else if (data.status === "REJECTED") {
      trip.status = "REJECTED";
    }

    await trip.save();

    // Create moderation record
    const moderation = await TripModeration.create({
      trip_id: new mongoose.Types.ObjectId(tripId),
      admin_id: new mongoose.Types.ObjectId(adminId),
      status: data.status,
      reasons: data.reasons,
      admin_message: data.admin_message,
    });

    // Send email notification to host (non-blocking)
    if (hostEmail) {
      const emailDetails = {
        tripTitle: trip.title,
        reasons: data.reasons,
        adminMessage: data.admin_message,
      };

      if (data.status === "APPROVED") {
        emailService.sendTripApprovedEmail(hostEmail, hostName, emailDetails).catch((error) => {
          console.error("Failed to send trip approved email:", error);
        });
      } else if (data.status === "REJECTED") {
        emailService.sendTripRejectedEmail(hostEmail, hostName, emailDetails).catch((error) => {
          console.error("Failed to send trip rejected email:", error);
        });
      } else if (data.status === "CHANGES_REQUESTED") {
        emailService
          .sendTripChangesRequestedEmail(hostEmail, hostName, emailDetails)
          .catch((error) => {
            console.error("Failed to send trip changes requested email:", error);
          });
      }
    }

    return toModerationResponse(moderation);
  },

  async getModerationHistory(tripId: string): Promise<ModerationResponse[]> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      throw new ModerationNotFoundError();
    }

    const trip = await Trip.findOne({ _id: tripId, is_deleted: false });
    if (!trip) {
      throw new ModerationNotFoundError();
    }

    const moderations = await TripModeration.find({ trip_id: tripId }).sort({ createdAt: -1 });

    return moderations.map(toModerationResponse);
  },
};

export default tripModerationService;
