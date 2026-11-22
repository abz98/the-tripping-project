import { Schema, model, Document } from "mongoose";

interface ICity extends Document {
  City: string;
  State: string;
  District: string;
  createdAt: Date;
  updatedAt: Date;
}

const citySchema = new Schema<ICity>(
  {
    City: {
      type: String,
      required: true,
      index: true,
    },
    State: {
      type: String,
      required: true,
      index: true,
    },
    District: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Compound index for efficient queries
citySchema.index({ State: 1, District: 1, City: 1 });

export const City = model<ICity>("City", citySchema);
