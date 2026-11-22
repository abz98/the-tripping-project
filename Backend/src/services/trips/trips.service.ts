/**
 * Trip Service - Host operations
 */

import mongoose from "mongoose";
import { Trip } from "../../models/trips/trips.model.js";
import { TripBatch } from "../../models/tripBatch/tripBatch.model.js";
import { TripCategory } from "../../models/tripCategory/tripCategory.model.js";
import { TripMedia } from "../../models/tripMedia/tripMedia.model.js";
import { TripPolicy } from "../../models/tripPolicy/tripPolicy.model.js";
import { Category } from "../../models/category/category.model.js";
import { User } from "../../models/users/users.model.js";
import { Role } from "../../models/roles/roles.model.js";
import { TripValidationError, TripNotFoundError, TripForbiddenError } from "./trips.errors.js";
import { emailService } from "../email/email.service.js";
import { ROLES } from "../../constants/roles.js";

export interface CreateTripDTO {
  title: string;
  categoryId: string[];
  destination: string[];
  pricePerPerson: number;
  route: {
    startLocation: string;
    endLocation: string;
    pickupLocations: string[];
  };
  tags: string[];
  batches: Array<{
    startDate: string;
    endDate: string;
    duration: {
      nights: number;
      days: number;
    };
    totalSlots: number;
  }>;
  images: string[];
  aboutTrip: string;
  cancellationPolicy: {
    type: "FREE" | "PARTIAL" | "NONE";
    freeCancellationDay: number;
  };
  additionalMessage?: string;
  tripRequestDescription?: string;
  status?: "DRAFT" | "PENDING_APPROVAL";
}

export interface UpdateTripDTO {
  title?: string;
  description?: string;
  duration_days?: number;
  duration_nights?: number;
  start_location?: string;
  end_location?: string;
  pickup_locations?: string[];
  route_summary?: string;
  base_price?: number;
  tax_included?: boolean;
  trip_tags?: string[];
}

export interface TripResponse {
  id: string;
  host: {
    id: string;
    name: string;
    email: string;
  };
  title: string;
  slug: string;
  categoryId: string[];
  destination: string[];
  pricePerPerson: number;
  route: {
    startLocation: string;
    endLocation: string;
    pickupLocations: string[];
  };
  tags: string[];
  batches: Array<{
    id: string;
    startDate: string;
    endDate: string;
    duration: {
      nights: number;
      days: number;
    };
    totalSlots: number;
    availableSlots: number;
    status: string;
  }>;
  images: string[];
  aboutTrip: string;
  cancellationPolicy: {
    type: string;
    freeCancellationDay: number;
  };
  additionalMessage?: string;
  tripRequestDescription?: string;
  status: string;
  is_featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Date.now().toString(36)
  );
}

/**
 * Notify all admins about a new trip pending approval
 */
async function notifyAdminsAboutNewTrip(trip: any, host: any): Promise<void> {
  try {
    // Find admin role
    const adminRole = await Role.findOne({ name: ROLES.ADMIN });
    if (!adminRole) {
      console.warn("⚠️ Admin role not found, skipping email notifications");
      return;
    }

    // Find all admin users
    const admins = await User.find({ role_id: adminRole._id, is_verified: true });

    if (admins.length === 0) {
      console.warn("⚠️ No verified admin users found, skipping email notifications");
      return;
    }

    // Send email to each admin
    const emailPromises = admins.map((admin) =>
      emailService.sendTripApprovalNotification(admin.email, admin.full_name, {
        tripId: trip._id.toString(),
        tripTitle: trip.title,
        hostName: host.full_name,
        hostEmail: host.email,
        destination: trip.destination || [],
        pricePerPerson: trip.base_price,
      }),
    );

    await Promise.allSettled(emailPromises);
    console.log(`✅ Sent trip approval notifications to ${admins.length} admin(s)`);
  } catch (error) {
    console.error("Failed to notify admins about new trip:", error);
    // Don't throw - we don't want to fail trip creation if email fails
  }
}

async function toTripResponse(trip: any): Promise<TripResponse> {
  const batches = await TripBatch.find({ trip_id: trip._id, available_slots: { $gt: 0 } }).sort({
    start_date: 1,
  });
  const categories = await TripCategory.find({ trip_id: trip._id });
  const media = await TripMedia.find({ trip_id: trip._id });
  const policy = await TripPolicy.findOne({ trip_id: trip._id });

  // Fetch host details
  const host = await User.findById(trip.host_id).select("full_name email");

  return {
    id: (trip._id as mongoose.Types.ObjectId).toString(),
    host: {
      id: trip.host_id.toString(),
      name: host?.full_name || "Unknown",
      email: host?.email || "",
    },
    title: trip.title,
    slug: trip.slug,
    categoryId: categories.map((cat) => cat.category_id.toString()),
    destination: trip.destination || [],
    pricePerPerson: trip.base_price,
    route: {
      startLocation: trip.start_location,
      endLocation: trip.end_location,
      pickupLocations: trip.pickup_locations || [],
    },
    tags: trip.trip_tags || [],
    batches: batches.map((batch) => ({
      id: batch._id.toString(),
      startDate: batch.start_date.toISOString().split("T")[0],
      endDate: batch.end_date.toISOString().split("T")[0],
      duration: {
        nights: trip.duration_nights,
        days: trip.duration_days,
      },
      totalSlots: batch.total_slots,
      availableSlots: batch.available_slots,
      status: batch.status,
    })),
    images: media.map((m) => m.media_url),
    aboutTrip: trip.about_trip || trip.description,
    cancellationPolicy: {
      type: policy?.cancellation_type || "NO_CANCELLATION",
      freeCancellationDay: policy?.cancellation_days || 0,
    },
    additionalMessage: trip.additional_message,
    tripRequestDescription: trip.trip_request_description,
    status: trip.status,
    is_featured: trip.is_featured,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
  };
}

function validateCreateTrip(data: CreateTripDTO): void {
  const errors: Record<string, string> = {};

  // Basic fields
  if (!data.title?.trim()) errors.title = "Title is required";
  if (!data.categoryId || !Array.isArray(data.categoryId) || data.categoryId.length === 0) {
    errors.categoryId = "At least one category ID is required";
  }
  if (!data.aboutTrip?.trim()) errors.aboutTrip = "About trip description is required";

  // Destination
  if (!data.destination || !Array.isArray(data.destination) || data.destination.length === 0) {
    errors.destination = "At least one destination is required";
  }

  // Price
  if (!data.pricePerPerson || data.pricePerPerson <= 0) {
    errors.pricePerPerson = "Price per person must be greater than 0";
  }

  // Route validation
  if (!data.route) {
    errors.route = "Route information is required";
  } else {
    if (!data.route.startLocation?.trim()) {
      errors["route.startLocation"] = "Start location is required";
    }
    if (!data.route.endLocation?.trim()) {
      errors["route.endLocation"] = "End location is required";
    }
    if (!data.route.pickupLocations || !Array.isArray(data.route.pickupLocations)) {
      errors["route.pickupLocations"] = "Pickup locations must be an array";
    }
  }

  // Tags
  if (!data.tags || !Array.isArray(data.tags) || data.tags.length === 0) {
    errors.tags = "At least one tag is required";
  }

  // Batches validation
  if (!data.batches || !Array.isArray(data.batches) || data.batches.length === 0) {
    errors.batches = "At least one batch is required";
  } else {
    data.batches.forEach((batch, index) => {
      if (!batch.startDate) {
        errors[`batches[${index}].startDate`] = "Start date is required";
      }
      if (!batch.endDate) {
        errors[`batches[${index}].endDate`] = "End date is required";
      }
      if (
        batch.startDate &&
        batch.endDate &&
        new Date(batch.startDate) >= new Date(batch.endDate)
      ) {
        errors[`batches[${index}].dates`] = "End date must be after start date";
      }
      if (!batch.duration || !batch.duration.days || !batch.duration.nights) {
        errors[`batches[${index}].duration`] = "Duration with days and nights is required";
      }
      if (!batch.totalSlots || batch.totalSlots <= 0) {
        errors[`batches[${index}].totalSlots`] = "Total slots must be greater than 0";
      }
    });
  }

  // Images
  if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
    errors.images = "At least one image is required";
  } else if (data.images.length > 15) {
    errors.images = "Maximum 15 images allowed";
  }

  // Cancellation policy
  if (!data.cancellationPolicy) {
    errors.cancellationPolicy = "Cancellation policy is required";
  } else {
    const validTypes = ["FREE", "PARTIAL", "NONE"];
    if (!validTypes.includes(data.cancellationPolicy.type)) {
      errors["cancellationPolicy.type"] = "Invalid cancellation type";
    }
    if (data.cancellationPolicy.type === "FREE") {
      if (
        data.cancellationPolicy.freeCancellationDay === undefined ||
        data.cancellationPolicy.freeCancellationDay < 0
      ) {
        errors["cancellationPolicy.freeCancellationDay"] =
          "Free cancellation day must be 0 or greater";
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new TripValidationError("Validation failed", errors);
  }
}

export const tripService = {
  async create(hostId: string, data: CreateTripDTO): Promise<TripResponse> {
    validateCreateTrip(data);

    // Validate all categories exist
    const categories = await Category.find({
      _id: { $in: data.categoryId.map((id) => new mongoose.Types.ObjectId(id)) },
      is_active: true,
    });

    if (categories.length !== data.categoryId.length) {
      throw new TripValidationError("One or more invalid category IDs");
    }

    try {
      // Create trip
      const trip = await Trip.create({
        host_id: new mongoose.Types.ObjectId(hostId),
        title: data.title.trim(),
        slug: generateSlug(data.title),
        description: data.aboutTrip.trim(),
        duration_days: data.batches[0].duration.days,
        duration_nights: data.batches[0].duration.nights,
        start_location: data.route.startLocation.trim(),
        end_location: data.route.endLocation.trim(),
        pickup_locations: data.route.pickupLocations,
        route_summary: `${data.route.startLocation} to ${data.route.endLocation}`,
        base_price: data.pricePerPerson,
        tax_included: false,
        trip_tags: data.tags,
        destination: data.destination,
        about_trip: data.aboutTrip.trim(),
        additional_message: data.additionalMessage?.trim() || "",
        trip_request_description: data.tripRequestDescription?.trim() || "",
        status: data.status || "DRAFT",
        approval_requests_left: 3,
        is_featured: false,
        is_deleted: false,
      });

      const tripId = trip._id;

      // Create trip categories (multiple)
      await TripCategory.create(
        data.categoryId.map((catId) => ({
          trip_id: tripId,
          category_id: new mongoose.Types.ObjectId(catId),
        })),
      );

      // Create batches
      await TripBatch.create(
        data.batches.map((batch) => ({
          trip_id: tripId,
          start_date: new Date(batch.startDate),
          end_date: new Date(batch.endDate),
          total_slots: batch.totalSlots,
          available_slots: batch.totalSlots,
          status: "OPEN",
        })),
      );

      // Create media
      await TripMedia.create(
        data.images.map((url, index) => ({
          trip_id: tripId,
          media_url: url,
          media_type: "IMAGE",
          is_cover: index === 0,
        })),
      );

      // Create cancellation policy
      const policyTypeMap: Record<string, "FREE" | "PARTIAL" | "NONE"> = {
        FREE_CANCELLATION: "FREE",
        PARTIAL_CANCELLATION: "PARTIAL",
        NO_CANCELLATION: "NONE",
        FREE: "FREE",
        PARTIAL: "PARTIAL",
        NONE: "NONE",
      };

      await TripPolicy.create({
        trip_id: tripId,
        cancellation_type: policyTypeMap[data.cancellationPolicy.type],
        cancellation_days:
          data.cancellationPolicy.type === "FREE" ? data.cancellationPolicy.freeCancellationDay : 0,
        host_message: data.additionalMessage?.trim() || "Please review our cancellation policy.",
      });

      // If trip is submitted for approval, notify admins
      if (trip.status === "PENDING_APPROVAL") {
        const host = await User.findById(hostId).select("full_name email");
        if (host) {
          await notifyAdminsAboutNewTrip(trip, host);
        }
      }

      return await toTripResponse(trip);
    } catch (error) {
      // If any operation fails, we should ideally clean up
      // But without transactions, we'll just throw the error
      throw error;
    }
  },

  async update(tripId: string, hostId: string, data: UpdateTripDTO): Promise<TripResponse> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      throw new TripNotFoundError();
    }

    const trip = await Trip.findOne({ _id: tripId, is_deleted: false });
    if (!trip) {
      throw new TripNotFoundError();
    }

    if (trip.host_id.toString() !== hostId) {
      throw new TripForbiddenError();
    }

    if (!["DRAFT", "CHANGES_REQUESTED"].includes(trip.status)) {
      throw new TripValidationError("Can only edit trips in DRAFT or CHANGES_REQUESTED status");
    }

    Object.assign(trip, data);
    await trip.save();

    return toTripResponse(trip);
  },

  async submitForApproval(tripId: string, hostId: string): Promise<TripResponse> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      throw new TripNotFoundError();
    }

    const trip = await Trip.findOne({ _id: tripId, is_deleted: false });
    if (!trip) {
      throw new TripNotFoundError();
    }

    if (trip.host_id.toString() !== hostId) {
      throw new TripForbiddenError();
    }

    if (!["DRAFT", "CHANGES_REQUESTED"].includes(trip.status)) {
      throw new TripValidationError("Can only submit trips in DRAFT or CHANGES_REQUESTED status");
    }

    if (trip.approval_requests_left <= 0) {
      throw new TripValidationError("No approval requests remaining");
    }

    trip.status = "PENDING_APPROVAL";
    trip.approval_requests_left -= 1;
    await trip.save();

    // Notify admins about the trip submission
    const host = await User.findById(hostId).select("full_name email");
    if (host) {
      await notifyAdminsAboutNewTrip(trip, host);
    }

    return toTripResponse(trip);
  },

  async getMyTrips(hostId: string | null = null): Promise<TripResponse[]> {
    const query: any = { is_deleted: false };

    if (hostId) {
      // For host - show all their trips
      query.host_id = new mongoose.Types.ObjectId(hostId);
    } else {
      // For public - only show published trips
      query.status = "PUBLISHED";
    }

    const trips = await Trip.find(query).sort({ createdAt: -1 });

    return Promise.all(trips.map(toTripResponse));
  },

  async searchTrips(filters: {
    destination?: string;
    travellers?: number;
    startDate?: string;
  }): Promise<TripResponse[]> {
    // Build trip query
    const tripQuery: any = { is_deleted: false, status: "PUBLISHED" };

    // Filter by destination (check pickup_locations)
    if (filters.destination) {
      tripQuery.pickup_locations = {
        $elemMatch: { $regex: new RegExp(filters.destination, "i") },
      };
    }

    // Find matching trips
    let trips = await Trip.find(tripQuery).sort({ createdAt: -1 });

    // If travellers or startDate filters are provided, we need to check batches
    if (filters.travellers || filters.startDate) {
      const tripIds = trips.map((trip) => trip._id);

      // Build batch query
      const batchQuery: any = { trip_id: { $in: tripIds }, status: "OPEN" };

      // Filter by available slots (travellers)
      if (filters.travellers) {
        batchQuery.available_slots = { $gte: filters.travellers };
      }

      // Filter by start date (check if date falls within batch start_date to end_date)
      if (filters.startDate) {
        const searchDate = new Date(filters.startDate);
        batchQuery.start_date = { $lte: searchDate };
        batchQuery.end_date = { $gte: searchDate };
        batchQuery.available_slots = { $gt: 0 };
      }

      // Find matching batches
      const matchingBatches = await TripBatch.find(batchQuery);
      const matchingTripIds = new Set(matchingBatches.map((batch) => batch.trip_id.toString()));

      // Filter trips to only those with matching batches
      trips = trips.filter((trip) => matchingTripIds.has(trip._id.toString()));
    }

    return Promise.all(trips.map(toTripResponse));
  },

  async getTripsByCategory(categoryId: string): Promise<TripResponse[]> {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw new TripValidationError("Invalid category ID");
    }

    // Find all trip_ids that have this category
    const tripCategories = await TripCategory.find({
      category_id: new mongoose.Types.ObjectId(categoryId),
    });

    if (tripCategories.length === 0) {
      return [];
    }

    const tripIds = tripCategories.map((tc) => tc.trip_id);

    // Find all published trips with this category
    const trips = await Trip.find({
      _id: { $in: tripIds },
      status: "PUBLISHED",
      is_deleted: false,
    }).sort({ is_featured: -1, createdAt: -1 });

    return Promise.all(trips.map(toTripResponse));
  },
  async getTripById(tripId: string): Promise<TripResponse> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      throw new TripNotFoundError();
    }

    const trip = await Trip.findOne({
      _id: new mongoose.Types.ObjectId(tripId),
      status: "PUBLISHED",
      is_deleted: false,
    });

    if (!trip) {
      throw new TripNotFoundError();
    }

    return toTripResponse(trip);
  },

  async delete(tripId: string, hostId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      throw new TripNotFoundError();
    }

    const trip = await Trip.findOne({ _id: tripId, is_deleted: false });
    if (!trip) {
      throw new TripNotFoundError();
    }

    if (trip.host_id.toString() !== hostId) {
      throw new TripForbiddenError();
    }

    trip.is_deleted = true;
    await trip.save();
  },

  async getModerationHistory(tripId: string, hostId: string): Promise<any[]> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      throw new TripNotFoundError();
    }

    const trip = await Trip.findOne({ _id: tripId, is_deleted: false });
    if (!trip) {
      throw new TripNotFoundError();
    }

    if (trip.host_id.toString() !== hostId) {
      throw new TripForbiddenError();
    }

    // Import TripModeration model
    const { TripModeration } = await import("../../models/tripModeration/tripModeration.model.js");

    const moderations = await TripModeration.find({ trip_id: tripId })
      .sort({ createdAt: -1 })
      .lean();

    return moderations.map((mod: any) => ({
      id: mod._id.toString(),
      status: mod.status,
      reasons: mod.reasons,
      admin_message: mod.admin_message,
      reviewed_at: mod.createdAt,
    }));
  },
};

export default tripService;
