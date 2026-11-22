/**
 * Review Service
 */

import mongoose from "mongoose";
import { Review } from "../../models/review/review.model.js";
import { Trip } from "../../models/trips/trips.model.js";
import { Booking } from "../../models/bookings/booking.model.js";
import {
  ReviewValidationError,
  ReviewNotFoundError,
  ReviewForbiddenError,
} from "./reviews.errors.js";

export interface CreateReviewDTO {
  trip_id: string;
  rating: number;
  comment: string;
}

export interface UpdateReviewDTO {
  rating?: number;
  comment?: string;
}

export interface ReviewResponse {
  id: string;
  trip_id: string;
  user_id: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

function toReviewResponse(review: any): ReviewResponse {
  return {
    id: (review._id as mongoose.Types.ObjectId).toString(),
    trip_id: review.trip_id.toString(),
    user_id: review.user_id.toString(),
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  };
}

export const reviewService = {
  async create(userId: string, data: CreateReviewDTO): Promise<ReviewResponse> {
    const errors: Record<string, string> = {};

    if (!data.trip_id) errors.trip_id = "Trip ID is required";
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      errors.rating = "Rating must be between 1 and 5";
    }
    if (!data.comment?.trim()) errors.comment = "Comment is required";

    if (Object.keys(errors).length > 0) {
      throw new ReviewValidationError("Validation failed", errors);
    }

    if (!mongoose.Types.ObjectId.isValid(data.trip_id)) {
      throw new ReviewValidationError("Invalid trip ID");
    }

    const trip = await Trip.findOne({ _id: data.trip_id, status: "PUBLISHED", is_deleted: false });
    if (!trip) {
      throw new ReviewValidationError("Trip not found");
    }

    // Check if user has a completed booking for this trip
    const booking = await Booking.findOne({
      user_id: userId,
      trip_id: data.trip_id,
      status: "COMPLETED",
    });

    if (!booking) {
      throw new ReviewValidationError("You can only review trips you have completed");
    }

    // Check if user already reviewed this trip
    const existingReview = await Review.findOne({ user_id: userId, trip_id: data.trip_id });
    if (existingReview) {
      throw new ReviewValidationError("You have already reviewed this trip");
    }

    const review = await Review.create({
      trip_id: new mongoose.Types.ObjectId(data.trip_id),
      user_id: new mongoose.Types.ObjectId(userId),
      rating: data.rating,
      comment: data.comment.trim(),
    });

    return toReviewResponse(review);
  },

  async update(reviewId: string, userId: string, data: UpdateReviewDTO): Promise<ReviewResponse> {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new ReviewNotFoundError();
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ReviewNotFoundError();
    }

    if (review.user_id.toString() !== userId) {
      throw new ReviewForbiddenError();
    }

    if (data.rating !== undefined) {
      if (data.rating < 1 || data.rating > 5) {
        throw new ReviewValidationError("Rating must be between 1 and 5");
      }
      review.rating = data.rating;
    }

    if (data.comment !== undefined) {
      if (!data.comment.trim()) {
        throw new ReviewValidationError("Comment cannot be empty");
      }
      review.comment = data.comment.trim();
    }

    await review.save();

    return toReviewResponse(review);
  },

  async delete(reviewId: string, userId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      throw new ReviewNotFoundError();
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      throw new ReviewNotFoundError();
    }

    if (review.user_id.toString() !== userId) {
      throw new ReviewForbiddenError();
    }

    await Review.findByIdAndDelete(reviewId);
  },
};

export default reviewService;
