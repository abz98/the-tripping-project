import { Schema, model, Document } from "mongoose";

interface ITripCategory extends Document {
  trip_id: Schema.Types.ObjectId;
  category_id: Schema.Types.ObjectId;
}

const tripCategorySchema = new Schema<ITripCategory>(
  {
    trip_id: {
      type: Schema.Types.ObjectId,
      ref: "trips",
      required: true,
    },
    category_id: {
      type: Schema.Types.ObjectId,
      ref: "categories",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const TripCategory = model<ITripCategory>("trip_categories", tripCategorySchema);
