/**
 * Trip Content Service - Itinerary, Inclusions, Media
 */

import mongoose from "mongoose";
import { Trip } from "../../models/trips/trips.model.js";
import { TripItinerary } from "../../models/tripItineraries/tripItineraries.model.js";
import { TripInclusion } from "../../models/tripInclusion/tripInclusion.model.js";
import { TripMedia } from "../../models/tripMedia/tripMedia.model.js";
import {
  TripContentValidationError,
  TripContentNotFoundError,
  TripContentForbiddenError,
} from "./tripContent.errors.js";

// DTOs
export interface CreateItineraryDTO {
  day_number: number;
  title: string;
  description: string;
  tags?: string[];
}

export interface UpdateItineraryDTO {
  day_number?: number;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface CreateInclusionDTO {
  type: "INCLUDED" | "EXCLUDED";
  description: string;
}

export interface CreateMediaDTO {
  media_url: string;
  media_type: "IMAGE" | "VIDEO";
  is_cover?: boolean;
}

// Responses
export interface ItineraryResponse {
  id: string;
  trip_id: string;
  day_number: number;
  title: string;
  description: string;
  tags: string[];
}

export interface InclusionResponse {
  id: string;
  trip_id: string;
  type: "INCLUDED" | "EXCLUDED";
  description: string;
}

export interface MediaResponse {
  id: string;
  trip_id: string;
  media_url: string;
  media_type: "IMAGE" | "VIDEO";
  is_cover: boolean;
  createdAt: Date;
}

async function verifyTripOwnership(tripId: string, hostId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw new TripContentNotFoundError("Trip not found");
  }

  const trip = await Trip.findOne({ _id: tripId, is_deleted: false });
  if (!trip) {
    throw new TripContentNotFoundError("Trip not found");
  }

  if (trip.host_id.toString() !== hostId) {
    throw new TripContentForbiddenError();
  }
}

export const tripContentService = {
  // Itinerary
  async addItinerary(
    tripId: string,
    hostId: string,
    data: CreateItineraryDTO,
  ): Promise<ItineraryResponse> {
    await verifyTripOwnership(tripId, hostId);

    const errors: Record<string, string> = {};
    if (!data.day_number || data.day_number < 1)
      errors.day_number = "Day number must be at least 1";
    if (!data.title?.trim()) errors.title = "Title is required";
    if (!data.description?.trim()) errors.description = "Description is required";

    if (Object.keys(errors).length > 0) {
      throw new TripContentValidationError("Validation failed", errors);
    }

    const itinerary = await TripItinerary.create({
      trip_id: new mongoose.Types.ObjectId(tripId),
      day_number: data.day_number,
      title: data.title.trim(),
      description: data.description.trim(),
      tags: data.tags || [],
    });

    return {
      id: (itinerary._id as mongoose.Types.ObjectId).toString(),
      trip_id: itinerary.trip_id.toString(),
      day_number: itinerary.day_number,
      title: itinerary.title,
      description: itinerary.description,
      tags: itinerary.tags,
    };
  },

  async updateItinerary(
    itineraryId: string,
    hostId: string,
    data: UpdateItineraryDTO,
  ): Promise<ItineraryResponse> {
    if (!mongoose.Types.ObjectId.isValid(itineraryId)) {
      throw new TripContentNotFoundError("Itinerary not found");
    }

    const itinerary = await TripItinerary.findById(itineraryId);
    if (!itinerary) {
      throw new TripContentNotFoundError("Itinerary not found");
    }

    await verifyTripOwnership(itinerary.trip_id.toString(), hostId);

    Object.assign(itinerary, data);
    await itinerary.save();

    return {
      id: (itinerary._id as mongoose.Types.ObjectId).toString(),
      trip_id: itinerary.trip_id.toString(),
      day_number: itinerary.day_number,
      title: itinerary.title,
      description: itinerary.description,
      tags: itinerary.tags,
    };
  },

  // Inclusions
  async addInclusion(
    tripId: string,
    hostId: string,
    data: CreateInclusionDTO,
  ): Promise<InclusionResponse> {
    await verifyTripOwnership(tripId, hostId);

    const errors: Record<string, string> = {};
    if (!data.type || !["INCLUDED", "EXCLUDED"].includes(data.type)) {
      errors.type = "Type must be INCLUDED or EXCLUDED";
    }
    if (!data.description?.trim()) errors.description = "Description is required";

    if (Object.keys(errors).length > 0) {
      throw new TripContentValidationError("Validation failed", errors);
    }

    const inclusion = await TripInclusion.create({
      trip_id: new mongoose.Types.ObjectId(tripId),
      type: data.type,
      description: data.description.trim(),
    });

    return {
      id: (inclusion._id as mongoose.Types.ObjectId).toString(),
      trip_id: inclusion.trip_id.toString(),
      type: inclusion.type,
      description: inclusion.description,
    };
  },

  // Media
  async uploadMedia(tripId: string, hostId: string, data: CreateMediaDTO): Promise<MediaResponse> {
    await verifyTripOwnership(tripId, hostId);

    const errors: Record<string, string> = {};
    if (!data.media_url?.trim()) errors.media_url = "Media URL is required";
    if (!data.media_type || !["IMAGE", "VIDEO"].includes(data.media_type)) {
      errors.media_type = "Media type must be IMAGE or VIDEO";
    }

    if (Object.keys(errors).length > 0) {
      throw new TripContentValidationError("Validation failed", errors);
    }

    // If setting as cover, unset other covers
    if (data.is_cover) {
      await TripMedia.updateMany({ trip_id: tripId, is_cover: true }, { is_cover: false });
    }

    const media = await TripMedia.create({
      trip_id: new mongoose.Types.ObjectId(tripId),
      media_url: data.media_url.trim(),
      media_type: data.media_type,
      is_cover: data.is_cover || false,
    });

    return {
      id: (media._id as mongoose.Types.ObjectId).toString(),
      trip_id: media.trip_id.toString(),
      media_url: media.media_url,
      media_type: media.media_type,
      is_cover: media.is_cover,
      createdAt: media.createdAt,
    };
  },

  async deleteMedia(mediaId: string, hostId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(mediaId)) {
      throw new TripContentNotFoundError("Media not found");
    }

    const media = await TripMedia.findById(mediaId);
    if (!media) {
      throw new TripContentNotFoundError("Media not found");
    }

    await verifyTripOwnership(media.trip_id.toString(), hostId);

    await TripMedia.findByIdAndDelete(mediaId);
  },
};

export default tripContentService;
