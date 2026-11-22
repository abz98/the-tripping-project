import mongoose, { Schema, Document } from "mongoose";

/**
 * Interface for RefreshToken document
 * Stores refresh tokens for JWT authentication with user association
 */
export interface IRefreshToken extends Document {
  user_id: mongoose.Types.ObjectId;
  token: string;
  expires_at: Date;
  is_revoked: boolean;
}

/**
 * Mongoose schema for RefreshToken
 * Includes indexes for efficient queries and TTL for automatic cleanup
 */
const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expires_at: {
      type: Date,
      required: true,
      index: true,
    },
    is_revoked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// TTL index for automatic cleanup of expired tokens
// MongoDB will automatically delete documents when expires_at is reached
refreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model<IRefreshToken>("RefreshToken", refreshTokenSchema);
