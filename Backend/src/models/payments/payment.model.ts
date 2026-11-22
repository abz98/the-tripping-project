import { Schema, model, Document } from "mongoose";

interface IPayment extends Document {
  booking_id: Schema.Types.ObjectId;
  user_id: Schema.Types.ObjectId;
  amount: number;
  currency: string;
  gateway: string;
  gateway_payment_id?: string;
  gateway_order_id?: string;
  status: "INITIATED" | "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  metadata?: Record<string, unknown>;
}

const paymentSchema = new Schema<IPayment>(
  {
    booking_id: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    gateway: {
      type: String,
      required: true,
    },
    gateway_payment_id: {
      type: String,
    },
    gateway_order_id: {
      type: String,
    },
    status: {
      type: String,
      enum: ["INITIATED", "PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "INITIATED",
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Payment = model<IPayment>("Payment", paymentSchema);
