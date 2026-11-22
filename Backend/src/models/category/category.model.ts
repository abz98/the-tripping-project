import { Schema, model, Document } from "mongoose";

interface ICategory extends Document {
  name: string;
  type: "EXPERIENCE" | "DESTINATION" | "SEASON";
  icon_url: string;
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["EXPERIENCE", "DESTINATION", "SEASON"],
      required: true,
    },
    icon_url: {
      type: String,
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Category = model<ICategory>("Category", categorySchema);
