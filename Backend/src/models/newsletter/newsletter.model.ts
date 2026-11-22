import mongoose, { Schema, Document } from "mongoose";

interface INewsletter extends Document {
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const newsletterSchema = new Schema<INewsletter>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Newsletter = mongoose.model<INewsletter>("Newsletter", newsletterSchema);
