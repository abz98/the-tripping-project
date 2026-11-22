import mongoose, { Schema, Document } from "mongoose";

export interface ITripChat extends Document {
  tripId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const TripChatSchema = new Schema<ITripChat>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      unique: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for active chats
TripChatSchema.index({ tripId: 1, isActive: 1 });

// Soft delete query helper
TripChatSchema.query.active = function () {
  return this.where({ deletedAt: null, isActive: true });
};

export const TripChat = mongoose.model<ITripChat>("TripChat", TripChatSchema);
