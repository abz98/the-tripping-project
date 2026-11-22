import mongoose, { Schema, Document } from "mongoose";

export enum ParticipantRole {
  USER = "USER",
  HOST = "HOST",
  ADMIN = "ADMIN",
}

export interface IChatParticipant extends Document {
  chatId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: ParticipantRole;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  lastReadAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatParticipantSchema = new Schema<IChatParticipant>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "TripChat",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(ParticipantRole),
      required: true,
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastReadAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for efficient queries
ChatParticipantSchema.index({ chatId: 1, userId: 1 }, { unique: true });
ChatParticipantSchema.index({ chatId: 1, role: 1, isActive: 1 });
ChatParticipantSchema.index({ userId: 1, isActive: 1 });

// Query helper for active participants
ChatParticipantSchema.query.active = function () {
  return this.where({ isActive: true, leftAt: null });
};

export const ChatParticipant = mongoose.model<IChatParticipant>(
  "ChatParticipant",
  ChatParticipantSchema,
);
