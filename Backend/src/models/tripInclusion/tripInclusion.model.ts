import { Schema, model, Document, Types } from "mongoose";

interface ITripInclusion extends Document {
  _id: Types.ObjectId;
  trip_id: Types.ObjectId;
  type: "INCLUDED" | "EXCLUDED";
  description: string;
}

const tripInclusionSchema = new Schema<ITripInclusion>(
  {
    trip_id: {
      type: Schema.Types.ObjectId,
      ref: "trips",
      required: true,
    },
    type: {
      type: String,
      enum: ["INCLUDED", "EXCLUDED"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const TripInclusion = model<ITripInclusion>("trip_inclusions", tripInclusionSchema);
