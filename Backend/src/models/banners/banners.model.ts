import { Schema, model, Document } from "mongoose";

interface IBanner extends Document {
  title: string;
  subtitle: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  position: number;
  is_active: boolean;
  start_date: Date;
  end_date?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    image_url: {
      type: String,
      required: true,
    },
    cta_text: {
      type: String,
      required: true,
    },
    cta_link: {
      type: String,
      required: true,
    },
    position: {
      type: Number,
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    start_date: {
      type: Date,
      default: Date.now,
    },
    end_date: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Banner = model<IBanner>("Banner", bannerSchema);
