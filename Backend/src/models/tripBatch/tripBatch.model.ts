import { Schema, model, Document } from "mongoose";

interface ITripBatch extends Document {
  trip_id: Schema.Types.ObjectId;
  start_date: Date;
  end_date: Date;
  total_slots: number;
  available_slots: number;
  price_override: number;
  status: "OPEN" | "CLOSED" | "COMPLETED";
}

const tripBatchSchema = new Schema<ITripBatch>(
  {
    trip_id: {
      type: Schema.Types.ObjectId,
      ref: "trips",
      required: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
    total_slots: {
      type: Number,
      required: true,
    },
    available_slots: {
      type: Number,
      required: true,
    },
    price_override: {
      type: Number,
      required: false,
    },
    status: {
      type: String,
      enum: ["OPEN", "CLOSED", "COMPLETED"],
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const TripBatch = model<ITripBatch>("trip_batches", tripBatchSchema);
