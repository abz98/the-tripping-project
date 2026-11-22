import { Schema, model, Document } from "mongoose";

interface IHost extends Document {
  user_id: Schema.Types.ObjectId;
  display_name: string;
  bio: string;
  rating: number;
  total_reviews: number;
  is_super_host: boolean;
  profile_image: string;
}

const hostSchema = new Schema<IHost>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    display_name: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    total_reviews: {
      type: Number,
      required: true,
      default: 0,
    },
    is_super_host: {
      type: Boolean,
      required: true,
      default: false,
    },
    profile_image: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Host = model<IHost>("Host", hostSchema);
