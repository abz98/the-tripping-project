import { Schema, model, Document } from "mongoose";

interface ITripPolicy extends Document {
  trip_id: Schema.Types.ObjectId;
  cancellation_type: "FREE" | "PARTIAL" | "NONE";
  cancellation_days: number;
  host_message: string;
}

const tripPolicySchema = new Schema<ITripPolicy>(
  {
    trip_id: {
      type: Schema.Types.ObjectId,
      ref: "trips",
      required: true,
    },
    cancellation_type: {
      type: String,
      enum: ["FREE", "PARTIAL", "NONE"],
      required: true,
    },
    cancellation_days: {
      type: Number,
      required: true,
    },
    host_message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const TripPolicy = model<ITripPolicy>("trip_policies", tripPolicySchema);
