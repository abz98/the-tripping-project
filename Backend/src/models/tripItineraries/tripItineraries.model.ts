import { Schema, model, Document, Types } from "mongoose";

interface ITripItinerary extends Document {
  trip_id: Types.ObjectId;
  day_number: number;
  title: string;
  description: string;
  tags: string[];
}

const tripItinerarySchema = new Schema<ITripItinerary>(
  {
    trip_id: {
      type: Schema.Types.ObjectId,
      ref: "trips",
      required: true,
    },
    day_number: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    tags: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const TripItinerary = model<ITripItinerary>("trip_itineraries", tripItinerarySchema);
