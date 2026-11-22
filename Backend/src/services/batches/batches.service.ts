/**
 * Batch Service - Host operations
 */

import mongoose from "mongoose";
import { TripBatch } from "../../models/tripBatch/tripBatch.model.js";
import { Trip } from "../../models/trips/trips.model.js";
import { BatchValidationError, BatchNotFoundError, BatchForbiddenError } from "./batches.errors.js";

export interface CreateBatchDTO {
  start_date: Date;
  end_date: Date;
  total_slots: number;
  price_override?: number;
}

export interface UpdateBatchDTO {
  start_date?: Date;
  end_date?: Date;
  total_slots?: number;
  price_override?: number;
}

export interface BatchResponse {
  id: string;
  trip_id: string;
  start_date: Date;
  end_date: Date;
  total_slots: number;
  available_slots: number;
  price_override?: number;
  status: string;
}

function toBatchResponse(batch: any): BatchResponse {
  return {
    id: (batch._id as mongoose.Types.ObjectId).toString(),
    trip_id: batch.trip_id.toString(),
    start_date: batch.start_date,
    end_date: batch.end_date,
    total_slots: batch.total_slots,
    available_slots: batch.available_slots,
    price_override: batch.price_override,
    status: batch.status,
  };
}

async function verifyTripOwnership(tripId: string, hostId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw new BatchNotFoundError("Trip not found");
  }

  const trip = await Trip.findOne({ _id: tripId, is_deleted: false });
  if (!trip) {
    throw new BatchNotFoundError("Trip not found");
  }

  if (trip.host_id.toString() !== hostId) {
    throw new BatchForbiddenError();
  }
}

async function verifyBatchOwnership(batchId: string, hostId: string): Promise<any> {
  if (!mongoose.Types.ObjectId.isValid(batchId)) {
    throw new BatchNotFoundError();
  }

  const batch = await TripBatch.findById(batchId);
  if (!batch) {
    throw new BatchNotFoundError();
  }

  const trip = await Trip.findOne({ _id: batch.trip_id, is_deleted: false });
  if (!trip) {
    throw new BatchNotFoundError("Trip not found");
  }

  if (trip.host_id.toString() !== hostId) {
    throw new BatchForbiddenError();
  }

  return batch;
}

export const batchService = {
  async create(tripId: string, hostId: string, data: CreateBatchDTO): Promise<BatchResponse> {
    await verifyTripOwnership(tripId, hostId);

    const errors: Record<string, string> = {};

    if (!data.start_date) errors.start_date = "Start date is required";
    if (!data.end_date) errors.end_date = "End date is required";
    if (!data.total_slots || data.total_slots < 1)
      errors.total_slots = "Total slots must be at least 1";

    if (Object.keys(errors).length > 0) {
      throw new BatchValidationError("Validation failed", errors);
    }

    const batch = await TripBatch.create({
      trip_id: new mongoose.Types.ObjectId(tripId),
      start_date: data.start_date,
      end_date: data.end_date,
      total_slots: data.total_slots,
      available_slots: data.total_slots,
      price_override: data.price_override,
      status: "OPEN",
    });

    return toBatchResponse(batch);
  },

  async update(batchId: string, hostId: string, data: UpdateBatchDTO): Promise<BatchResponse> {
    const batch = await verifyBatchOwnership(batchId, hostId);

    if (batch.status !== "OPEN") {
      throw new BatchValidationError("Can only update OPEN batches");
    }

    if (data.total_slots !== undefined) {
      const bookedSlots = batch.total_slots - batch.available_slots;
      if (data.total_slots < bookedSlots) {
        throw new BatchValidationError("Cannot reduce slots below booked count");
      }
      batch.available_slots = data.total_slots - bookedSlots;
      batch.total_slots = data.total_slots;
    }

    if (data.start_date !== undefined) batch.start_date = data.start_date;
    if (data.end_date !== undefined) batch.end_date = data.end_date;
    if (data.price_override !== undefined) batch.price_override = data.price_override;

    await batch.save();

    return toBatchResponse(batch);
  },

  async close(batchId: string, hostId: string): Promise<BatchResponse> {
    const batch = await verifyBatchOwnership(batchId, hostId);

    if (batch.status !== "OPEN") {
      throw new BatchValidationError("Batch is not open");
    }

    batch.status = "CLOSED";
    await batch.save();

    return toBatchResponse(batch);
  },

  async list(tripId: string, hostId: string): Promise<BatchResponse[]> {
    await verifyTripOwnership(tripId, hostId);

    const batches = await TripBatch.find({ trip_id: tripId }).sort({ start_date: 1 });

    return batches.map(toBatchResponse);
  },
};

export default batchService;
