import mongoose, { Schema, Document } from "mongoose";
import { ParticipantRole } from "../chatParticipant/chatParticipant.model";

export enum MessageType {
  TEXT = "TEXT",
  SYSTEM = "SYSTEM",
  IMAGE = "IMAGE",
  FILE = "FILE",
}

export interface IChatMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: ParticipantRole;
  messageType: MessageType;
  content: string;
  metadata?: {
    fileName?: string;
    fileUrl?: string;
    fileSize?: number;
    mimeType?: string;
  };
  // Recipients who should see this message (computed at send time)
  visibleTo: mongoose.Types.ObjectId[];
  isEdited: boolean;
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "TripChat",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      enum: Object.values(ParticipantRole),
      required: true,
      index: true,
    },
    messageType: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    metadata: {
      fileName: String,
      fileUrl: String,
      fileSize: Number,
      mimeType: String,
    },
    // Array of user IDs who can see this message
    visibleTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
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

// Compound indexes for efficient message retrieval
ChatMessageSchema.index({ chatId: 1, createdAt: -1 });
ChatMessageSchema.index({ chatId: 1, deletedAt: 1, createdAt: -1 });
ChatMessageSchema.index({ visibleTo: 1, chatId: 1, createdAt: -1 });

// Query helper for non-deleted messages
ChatMessageSchema.query.active = function () {
  return this.where({ deletedAt: null });
};

export const ChatMessage = mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
