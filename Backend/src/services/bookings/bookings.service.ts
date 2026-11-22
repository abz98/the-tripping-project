/**
 * Booking Service
 */

import mongoose from "mongoose";
import { Booking } from "../../models/bookings/booking.model.js";
import { Trip } from "../../models/trips/trips.model.js";
import { TripBatch } from "../../models/tripBatch/tripBatch.model.js";
import {
  BookingValidationError,
  BookingNotFoundError,
  BookingForbiddenError,
} from "./bookings.errors.js";

export interface CreateBookingDTO {
  // Old format (backward compatible)
  trip_id?: string;
  batch_id?: string;
  num_travelers?: number;

  // New format
  batchId?: string;
  pickupLocation?: string;
  slots?: number;
  message?: string;
}

export interface BookingResponse {
  id: string;
  user_id: string;
  trip_id: string;
  batch_id: string;
  num_travelers: number;
  pickup_location?: string;
  message?: string;
  total_amount: number;
  status: string;
  payment_status: string;
  cancellation_reason?: string;
  createdAt: Date;
  updatedAt: Date;
  trip?: {
    title: string;
    slug: string;
  };
  batch?: {
    start_date: Date;
    end_date: Date;
  };
}

function toBookingResponse(booking: any, trip?: any, batch?: any): BookingResponse {
  const response: BookingResponse = {
    id: (booking._id as mongoose.Types.ObjectId).toString(),
    user_id: booking.user_id.toString(),
    trip_id: booking.trip_id.toString(),
    batch_id: booking.batch_id.toString(),
    num_travelers: booking.num_travelers,
    pickup_location: booking.pickup_location,
    message: booking.message,
    total_amount: booking.total_amount,
    status: booking.status,
    payment_status: booking.payment_status,
    cancellation_reason: booking.cancellation_reason,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };

  if (trip) {
    response.trip = { title: trip.title, slug: trip.slug };
  }

  if (batch) {
    response.batch = { start_date: batch.start_date, end_date: batch.end_date };
  }

  return response;
}

export const bookingService = {
  async create(userId: string, data: CreateBookingDTO): Promise<BookingResponse> {
    // Support both old and new format
    const batchId = data.batchId || data.batch_id;
    const tripId = data.trip_id; // Will be derived from batch if not provided
    const numTravelers = data.slots || data.num_travelers;
    const pickupLocation = data.pickupLocation;
    const message = data.message;

    const errors: Record<string, string> = {};

    if (!batchId) errors.batchId = "Batch ID is required";
    if (!numTravelers || numTravelers < 1) {
      errors.slots = "Number of travelers must be at least 1";
    }

    if (Object.keys(errors).length > 0) {
      throw new BookingValidationError("Validation failed", errors);
    }

    if (!mongoose.Types.ObjectId.isValid(batchId!)) {
      throw new BookingValidationError("Invalid batch ID");
    }

    // Get batch first to find trip_id
    const batch = await TripBatch.findOne({
      _id: batchId,
      status: "OPEN",
    });
    if (!batch) {
      throw new BookingValidationError("Batch not found or not available");
    }

    const actualTripId = tripId || batch.trip_id.toString();

    const trip = await Trip.findOne({
      _id: actualTripId,
      status: "PUBLISHED",
      is_deleted: false,
    });
    if (!trip) {
      throw new BookingValidationError("Trip not found or not available");
    }

    // Validate pickup location if provided
    if (pickupLocation && trip.pickup_locations) {
      const validPickup = trip.pickup_locations.some(
        (loc: string) => loc.toLowerCase() === pickupLocation.toLowerCase(),
      );
      if (!validPickup) {
        throw new BookingValidationError("Invalid pickup location");
      }
    }

    if (batch.available_slots < numTravelers!) {
      throw new BookingValidationError("Not enough slots available");
    }

    const price = batch.price_override || trip.base_price;
    const totalAmount = price * numTravelers!;

    // NOTE: Slots are NOT decremented here - they will be decremented after payment confirmation
    // This allows multiple users to attempt booking the same slots until payment is confirmed

    const booking = await Booking.create({
      user_id: new mongoose.Types.ObjectId(userId),
      trip_id: new mongoose.Types.ObjectId(actualTripId),
      batch_id: new mongoose.Types.ObjectId(batchId),
      num_travelers: numTravelers,
      pickup_location: pickupLocation,
      message: message,
      total_amount: totalAmount,
      status: "PENDING",
      payment_status: "PENDING",
    });

    // Send email notification to host (fire-and-forget)
    (async () => {
      try {
        const { User } = await import("../../models/users/users.model.js");
        const { emailService } = await import("../email/email.service.js");

        // Get user and host details
        const [user, host] = await Promise.all([
          User.findById(userId),
          User.findById(trip.host_id),
        ]);

        if (host && host.email && user) {
          const batchStartDate = new Date(batch.start_date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          await emailService.sendBookingNotificationToHost({
            hostEmail: host.email,
            hostName: host.full_name,
            userName: user.full_name,
            userEmail: user.email,
            tripTitle: trip.title,
            numTravelers: numTravelers!,
            batchStartDate,
            pickupLocation: pickupLocation || "Not specified",
            userMessage: message || "No message provided",
            totalAmount,
          });
        }
      } catch (emailError) {
        console.error("Failed to send booking notification email:", emailError);
        // Don't throw - email failure shouldn't block booking creation
      }
    })();

    return toBookingResponse(booking, trip, batch);
  },

  async getById(bookingId: string, userId: string): Promise<BookingResponse> {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new BookingNotFoundError();
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new BookingNotFoundError();
    }

    if (booking.user_id.toString() !== userId) {
      throw new BookingForbiddenError();
    }

    const [trip, batch] = await Promise.all([
      Trip.findById(booking.trip_id),
      TripBatch.findById(booking.batch_id),
    ]);

    return toBookingResponse(booking, trip, batch);
  },

  async cancel(bookingId: string, userId: string, reason?: string): Promise<BookingResponse> {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new BookingNotFoundError();
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new BookingNotFoundError();
    }

    if (booking.user_id.toString() !== userId) {
      throw new BookingForbiddenError();
    }

    if (booking.status === "CANCELLED") {
      throw new BookingValidationError("Booking is already cancelled");
    }

    if (booking.status === "COMPLETED") {
      throw new BookingValidationError("Cannot cancel a completed booking");
    }

    // Restore slots ONLY if payment was already made (slots were decremented)
    if (booking.payment_status === "PAID") {
      const batch = await TripBatch.findById(booking.batch_id);
      if (batch) {
        batch.available_slots += booking.num_travelers;
        await batch.save();
      }
    }

    booking.status = "CANCELLED";
    booking.cancellation_reason = reason;
    await booking.save();

    const trip = await Trip.findById(booking.trip_id);
    const batch = await TripBatch.findById(booking.batch_id);

    // Remove user from trip chat (fire-and-forget)
    (async () => {
      try {
        const { User } = await import("../../models/users/users.model.js");
        const { paymentChatIntegrationService } =
          await import("../chat/payment-integration.service.js");

        const user = await User.findById(booking.user_id);
        if (user && trip) {
          await paymentChatIntegrationService.onBookingCancellation(
            trip._id.toString(),
            booking.user_id.toString(),
            user.full_name,
          );
        }
      } catch (chatError) {
        console.error("Failed to remove user from chat:", chatError);
      }
    })();

    return toBookingResponse(booking, trip, batch);
  },

  async getUserBookings(userId: string): Promise<BookingResponse[]> {
    const bookings = await Booking.find({ user_id: userId }).sort({ createdAt: -1 });

    const tripIds = [...new Set(bookings.map((b) => b.trip_id.toString()))];
    const batchIds = [...new Set(bookings.map((b) => b.batch_id.toString()))];

    const [trips, batches] = await Promise.all([
      Trip.find({ _id: { $in: tripIds } }),
      TripBatch.find({ _id: { $in: batchIds } }),
    ]);

    const tripMap = new Map(trips.map((t) => [(t._id as mongoose.Types.ObjectId).toString(), t]));
    const batchMap = new Map(
      batches.map((b) => [(b._id as mongoose.Types.ObjectId).toString(), b]),
    );

    return bookings.map((booking) =>
      toBookingResponse(
        booking,
        tripMap.get(booking.trip_id.toString()),
        batchMap.get(booking.batch_id.toString()),
      ),
    );
  },

  async getHostPendingBookings(hostId: string): Promise<BookingResponse[]> {
    // First, get all trips owned by the host
    const hostTrips = await Trip.find({
      host_id: new mongoose.Types.ObjectId(hostId),
      is_deleted: false,
    });

    if (hostTrips.length === 0) {
      return [];
    }

    const tripIds = hostTrips.map((t) => t._id);

    // Get all pending bookings for these trips
    const bookings = await Booking.find({
      trip_id: { $in: tripIds },
      status: "PENDING",
    }).sort({ createdAt: -1 });

    if (bookings.length === 0) {
      return [];
    }

    const batchIds = [...new Set(bookings.map((b) => b.batch_id.toString()))];
    const userIds = [...new Set(bookings.map((b) => b.user_id.toString()))];

    const [batches, users] = await Promise.all([
      TripBatch.find({ _id: { $in: batchIds } }),
      (async () => {
        const { User } = await import("../../models/users/users.model.js");
        return User.find({ _id: { $in: userIds } });
      })(),
    ]);

    const tripMap = new Map(
      hostTrips.map((t) => [(t._id as mongoose.Types.ObjectId).toString(), t]),
    );
    const batchMap = new Map(
      batches.map((b) => [(b._id as mongoose.Types.ObjectId).toString(), b]),
    );
    const userMap = new Map(
      users.map((u: any) => [(u._id as mongoose.Types.ObjectId).toString(), u]),
    );

    return bookings.map((booking) => {
      const response = toBookingResponse(
        booking,
        tripMap.get(booking.trip_id.toString()),
        batchMap.get(booking.batch_id.toString()),
      );

      // Add user details
      const user = userMap.get(booking.user_id.toString());
      if (user) {
        (response as any).user = {
          name: user.full_name,
          email: user.email,
        };
      }

      return response;
    });
  },

  async rejectBooking(
    bookingId: string,
    hostId: string,
    reason?: string,
  ): Promise<BookingResponse> {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new BookingNotFoundError();
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new BookingNotFoundError();
    }

    // Get the trip to verify host ownership
    const trip = await Trip.findById(booking.trip_id);
    if (!trip) {
      throw new BookingValidationError("Trip not found");
    }

    if (trip.host_id.toString() !== hostId) {
      throw new BookingForbiddenError();
    }

    if (booking.status !== "PENDING") {
      throw new BookingValidationError("Only pending bookings can be rejected");
    }

    // NOTE: No need to restore slots since they were never decremented
    // Slots are only decremented after payment confirmation

    // Update booking status
    booking.status = "CANCELLED";
    booking.cancellation_reason = reason || "Rejected by host";
    await booking.save();

    const batch = await TripBatch.findById(booking.batch_id);

    // Send rejection email to user (fire-and-forget)
    (async () => {
      try {
        const { User } = await import("../../models/users/users.model.js");
        const { emailService } = await import("../email/email.service.js");

        const user = await User.findById(booking.user_id);
        if (user && user.email) {
          await emailService.sendBookingRejectionToUser({
            userEmail: user.email,
            userName: user.full_name,
            tripTitle: trip.title,
            reason:
              reason || "The host is unable to accommodate your booking request at this time.",
          });
        }
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }
    })();

    return toBookingResponse(booking, trip, batch);
  },

  async confirmBooking(bookingId: string, hostId: string): Promise<BookingResponse> {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new BookingNotFoundError();
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new BookingNotFoundError();
    }

    // Get the trip to verify host ownership
    const trip = await Trip.findById(booking.trip_id);
    if (!trip) {
      throw new BookingValidationError("Trip not found");
    }

    if (trip.host_id.toString() !== hostId) {
      throw new BookingForbiddenError();
    }

    if (booking.status !== "PENDING") {
      throw new BookingValidationError("Only pending bookings can be confirmed");
    }

    // Get batch details
    const batch = await TripBatch.findById(booking.batch_id);
    if (!batch) {
      throw new BookingValidationError("Batch not found");
    }

    // Update booking status to CONFIRMED
    booking.status = "CONFIRMED";
    await booking.save();

    // Send confirmation email to user (fire-and-forget)
    (async () => {
      try {
        const { User } = await import("../../models/users/users.model.js");
        const { emailService } = await import("../email/email.service.js");

        const user = await User.findById(booking.user_id);
        if (user && user.email) {
          const batchStartDate = new Date(batch.start_date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          await emailService.sendBookingConfirmationToUser({
            userEmail: user.email,
            userName: user.full_name,
            tripTitle: trip.title,
            numTravelers: booking.num_travelers,
            batchStartDate,
            pickupLocation: booking.pickup_location || "Not specified",
            totalAmount: booking.total_amount,
            bookingId: booking._id.toString(),
          });
        }
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }
    })();

    return toBookingResponse(booking, trip, batch);
  },
};

export default bookingService;
