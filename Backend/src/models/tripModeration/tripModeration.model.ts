import { Schema, model, Document } from "mongoose";

interface ITripModeration extends Document {
  trip_id: Schema.Types.ObjectId;
  admin_id: Schema.Types.ObjectId;
  status: "APPROVED" | "CHANGES_REQUESTED" | "REJECTED";
  reasons: string[];
  admin_message?: string;
}

const tripModerationSchema = new Schema<ITripModeration>(
  {
    trip_id: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    admin_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["APPROVED", "CHANGES_REQUESTED", "REJECTED"],
      required: true,
    },
    reasons: {
      type: Schema.Types.Mixed,
      required: true,
    },
    admin_message: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const TripModeration = model<ITripModeration>("TripModeration", tripModerationSchema);
