/**
 * Public Trips Service
 */

import mongoose from "mongoose";
import { Trip } from "../../models/trips/trips.model.js";
import { TripBatch } from "../../models/tripBatch/tripBatch.model.js";
import { Review } from "../../models/review/review.model.js";
import { TripItinerary } from "../../models/tripItineraries/tripItineraries.model.js";
import { TripInclusion } from "../../models/tripInclusion/tripInclusion.model.js";
import { TripMedia } from "../../models/tripMedia/tripMedia.model.js";
import { PublicTripNotFoundError } from "./publicTrips.errors.js";

export interface TripListQuery {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: number;
  page?: number;
  limit?: number;
}

export interface TripListResponse {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  duration_nights: number;
  start_location: string;
  end_location: string;
  base_price: number;
  is_featured: boolean;
  cover_image?: string;
}

export interface TripDetailResponse {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  duration_nights: number;
  start_location: string;
  end_location: string;
  pickup_locations: string[];
  route_summary: string;
  base_price: number;
  tax_included: boolean;
  trip_tags: string[];
  is_featured: boolean;
  itineraries: Array<{
    id: string;
    day_number: number;
    title: string;
    description: string;
    tags: string[];
  }>;
  inclusions: Array<{
    id: string;
    type: string;
    description: string;
  }>;
  media: Array<{
    id: string;
    media_url: string;
    media_type: string;
    is_cover: boolean;
  }>;
}

export interface ReviewResponse {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface BatchResponse {
  id: string;
  start_date: Date;
  end_date: Date;
  total_slots: number;
  available_slots: number;
  price_override?: number;
  status: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const publicTripsService = {
  async listTrips(query: TripListQuery): Promise<PaginatedResponse<TripListResponse>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {
      status: "PUBLISHED",
      is_deleted: false,
    };

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: "i" } },
        { description: { $regex: query.search, $options: "i" } },
      ];
    }

    if (query.minPrice !== undefined) {
      filter.base_price = { ...filter.base_price, $gte: query.minPrice };
    }

    if (query.maxPrice !== undefined) {
      filter.base_price = { ...filter.base_price, $lte: query.maxPrice };
    }

    if (query.duration) {
      filter.duration_days = query.duration;
    }

    const [trips, total] = await Promise.all([
      Trip.find(filter).sort({ is_featured: -1, createdAt: -1 }).skip(skip).limit(limit),
      Trip.countDocuments(filter),
    ]);

    // Get cover images for trips
    const tripIds = trips.map((t) => t._id);
    const coverImages = await TripMedia.find({
      trip_id: { $in: tripIds },
      is_cover: true,
    });

    const coverMap = new Map(coverImages.map((m) => [m.trip_id.toString(), m.media_url]));

    const data = trips.map((t) => ({
      id: (t._id as mongoose.Types.ObjectId).toString(),
      title: t.title,
      description: t.description,
      duration_days: t.duration_days,
      duration_nights: t.duration_nights,
      start_location: t.start_location,
      end_location: t.end_location,
      base_price: t.base_price,
      is_featured: t.is_featured,
      cover_image: coverMap.get((t._id as mongoose.Types.ObjectId).toString()),
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getTripBySlug(slug: string): Promise<TripDetailResponse> {
    const trip = await Trip.findOne({ slug, status: "PUBLISHED", is_deleted: false });
    if (!trip) {
      throw new PublicTripNotFoundError();
    }

    const tripId = trip._id;

    const [itineraries, inclusions, media] = await Promise.all([
      TripItinerary.find({ trip_id: tripId }).sort({ day_number: 1 }),
      TripInclusion.find({ trip_id: tripId }),
      TripMedia.find({ trip_id: tripId }).sort({ is_cover: -1, createdAt: 1 }),
    ]);

    return {
      id: (trip._id as mongoose.Types.ObjectId).toString(),
      title: trip.title,
      description: trip.description,
      duration_days: trip.duration_days,
      duration_nights: trip.duration_nights,
      start_location: trip.start_location,
      end_location: trip.end_location,
      pickup_locations: trip.pickup_locations || [],
      route_summary: trip.route_summary,
      base_price: trip.base_price,
      tax_included: trip.tax_included,
      trip_tags: trip.trip_tags || [],
      is_featured: trip.is_featured,
      itineraries: itineraries.map((i) => ({
        id: (i._id as mongoose.Types.ObjectId).toString(),
        day_number: i.day_number,
        title: i.title,
        description: i.description,
        tags: i.tags,
      })),
      inclusions: inclusions.map((i) => ({
        id: (i._id as mongoose.Types.ObjectId).toString(),
        type: i.type,
        description: i.description,
      })),
      media: media.map((m) => ({
        id: (m._id as mongoose.Types.ObjectId).toString(),
        media_url: m.media_url,
        media_type: m.media_type,
        is_cover: m.is_cover,
      })),
    };
  },

  async getTripReviews(tripId: string): Promise<ReviewResponse[]> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      throw new PublicTripNotFoundError();
    }

    const trip = await Trip.findOne({ _id: tripId, status: "PUBLISHED", is_deleted: false });
    if (!trip) {
      throw new PublicTripNotFoundError();
    }

    const reviews = await Review.find({ trip_id: tripId }).sort({ createdAt: -1 });

    return reviews.map((r) => ({
      id: (r._id as mongoose.Types.ObjectId).toString(),
      user_id: r.user_id.toString(),
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));
  },

  async getTripBatches(tripId: string): Promise<BatchResponse[]> {
    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      throw new PublicTripNotFoundError();
    }

    const trip = await Trip.findOne({ _id: tripId, status: "PUBLISHED", is_deleted: false });
    if (!trip) {
      throw new PublicTripNotFoundError();
    }

    const batches = await TripBatch.find({
      trip_id: tripId,
      status: "OPEN",
      start_date: { $gte: new Date() },
      available_slots: { $gt: 0 }, // Only return batches with available slots
    }).sort({ start_date: 1 });

    return batches.map((b) => ({
      id: (b._id as mongoose.Types.ObjectId).toString(),
      start_date: b.start_date,
      end_date: b.end_date,
      total_slots: b.total_slots,
      available_slots: b.available_slots,
      price_override: b.price_override,
      status: b.status,
    }));
  },
};

export default publicTripsService;
