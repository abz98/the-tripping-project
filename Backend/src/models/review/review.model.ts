import { Schema, model, Document } from "mongoose";

interface IReview extends Document {
  trip_id: Schema.Types.ObjectId;
  user_id: Schema.Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    trip_id: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Review = model<IReview>("Review", reviewSchema);
