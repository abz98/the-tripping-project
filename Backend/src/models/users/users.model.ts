import mongoose, { Schema, Document } from "mongoose";

interface IUser extends Document {
  role_id: mongoose.Types.ObjectId;
  full_name: string;
  email: string;
  phone?: string;
  password_hash: string;
  is_verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    role_id: {
      type: Schema.Types.ObjectId,
      ref: "roles",
      required: true,
    },
    full_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
    },
    password_hash: {
      type: String,
      required: true,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const User = mongoose.model<IUser>("User", userSchema);
