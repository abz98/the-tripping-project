import { Schema, model, Document } from "mongoose";

interface ITripMedia extends Document {
  trip_id: Schema.Types.ObjectId;
  media_url: string;
  media_type: "IMAGE" | "VIDEO";
  is_cover: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tripMediaSchema = new Schema<ITripMedia>(
  {
    trip_id: {
      type: Schema.Types.ObjectId,
      ref: "trips",
      required: true,
    },
    media_url: {
      type: String,
      required: true,
    },
    media_type: {
      type: String,
      enum: ["IMAGE", "VIDEO"],
      required: true,
    },
    is_cover: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const TripMedia = model<ITripMedia>("trip_media", tripMediaSchema);
