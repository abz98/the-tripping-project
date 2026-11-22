import { Schema, model, Document } from "mongoose";

interface IBooking extends Document {
  user_id: Schema.Types.ObjectId;
  trip_id: Schema.Types.ObjectId;
  batch_id: Schema.Types.ObjectId;
  num_travelers: number;
  pickup_location?: string;
  message?: string;
  total_amount: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  payment_status: "PENDING" | "PAID" | "REFUNDED";
  cancellation_reason?: string;
}

const bookingSchema = new Schema<IBooking>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    trip_id: {
      type: Schema.Types.ObjectId,
      ref: "trips",
      required: true,
    },
    batch_id: {
      type: Schema.Types.ObjectId,
      ref: "trip_batches",
      required: true,
    },
    num_travelers: {
      type: Number,
      required: true,
      min: 1,
    },
    pickup_location: {
      type: String,
    },
    message: {
      type: String,
    },
    total_amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"],
      default: "PENDING",
    },
    payment_status: {
      type: String,
      enum: ["PENDING", "PAID", "REFUNDED"],
      default: "PENDING",
    },
    cancellation_reason: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Booking = model<IBooking>("Booking", bookingSchema);
