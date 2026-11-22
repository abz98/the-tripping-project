import mongoose from "mongoose";
import { TripChat, ITripChat } from "../../models/tripChat/tripChat.model";
import {
  ChatParticipant,
  IChatParticipant,
  ParticipantRole,
} from "../../models/chatParticipant/chatParticipant.model";
import { ChatMessage, IChatMessage, MessageType } from "../../models/chatMessage/chatMessage.model";
import {
  ChatNotFoundError,
  UnauthorizedChatAccessError,
  InvalidParticipantError,
  MessageNotFoundError,
} from "./chat.errors";

// System user ID for automated messages (not a real user)
const SYSTEM_USER_ID = new mongoose.Types.ObjectId("000000000000000000000000");

export class ChatService {
  /**
   * Create or get existing chat for a trip
   */
  async getOrCreateTripChat(tripId: string): Promise<ITripChat> {
    let chat = await TripChat.findOne({ tripId, deletedAt: null });

    if (!chat) {
      chat = await TripChat.create({ tripId });
    }

    return chat;
  }

  /**
   * Add participant to chat
   * Called after successful payment or when admin/host joins
   */
  async addParticipant(
    chatId: string,
    userId: string,
    role: ParticipantRole,
  ): Promise<IChatParticipant> {
    // Check if participant already exists
    let participant = await ChatParticipant.findOne({ chatId, userId });

    if (participant) {
      // Reactivate if previously left
      if (!participant.isActive) {
        participant.isActive = true;
        participant.leftAt = undefined;
        participant.joinedAt = new Date();
        await participant.save();
      }
      return participant;
    }

    // Create new participant
    participant = await ChatParticipant.create({
      chatId,
      userId,
      role,
      joinedAt: new Date(),
      isActive: true,
    });

    return participant;
  }

  /**
   * Remove participant (soft delete)
   */
  async removeParticipant(chatId: string, userId: string): Promise<void> {
    const participant = await ChatParticipant.findOne({ chatId, userId });

    if (!participant) {
      throw new InvalidParticipantError("Participant not found");
    }

    participant.isActive = false;
    participant.leftAt = new Date();
    await participant.save();
  }

  /**
   * Get all active participants for a chat
   */
  async getChatParticipants(chatId: string): Promise<IChatParticipant[]> {
    return ChatParticipant.find({
      chatId,
      isActive: true,
      leftAt: null,
    })
      .populate("userId", "name email profilePicture")
      .sort({ joinedAt: 1 });
  }

  /**
   * CRITICAL: Compute recipients based on sender role
   * This enforces the three-way visibility rules
   */
  private async computeRecipients(
    chatId: string,
    senderRole: ParticipantRole,
    senderId: string,
  ): Promise<mongoose.Types.ObjectId[]> {
    const participants = await ChatParticipant.find({
      chatId,
      isActive: true,
      leftAt: null,
    });

    const recipients: mongoose.Types.ObjectId[] = [];

    switch (senderRole) {
      case ParticipantRole.USER:
        // USER messages visible to: HOST + ADMIN only
        participants.forEach((p) => {
          if (p.role === ParticipantRole.HOST || p.role === ParticipantRole.ADMIN) {
            recipients.push(p.userId);
          }
        });
        break;

      case ParticipantRole.HOST:
        // HOST messages visible to: ALL USERS + ADMIN
        participants.forEach((p) => {
          if (p.userId.toString() !== senderId) {
            recipients.push(p.userId);
          }
        });
        break;

      case ParticipantRole.ADMIN:
        // ADMIN messages visible to: ALL USERS + HOST
        participants.forEach((p) => {
          if (p.userId.toString() !== senderId) {
            recipients.push(p.userId);
          }
        });
        break;
    }

    // Always include sender in visibleTo for their own message retrieval
    recipients.push(new mongoose.Types.ObjectId(senderId));

    return recipients;
  }

  /**
   * Send a message with computed visibility
   */
  async sendMessage(
    chatId: string,
    senderId: string,
    content: string,
    messageType: MessageType = MessageType.TEXT,
    metadata?: any,
  ): Promise<IChatMessage> {
    // Verify sender is active participant
    const sender = await ChatParticipant.findOne({
      chatId,
      userId: senderId,
      isActive: true,
      leftAt: null,
    });

    if (!sender) {
      throw new UnauthorizedChatAccessError("User is not an active participant");
    }

    // Check if chat is still active based on batch end date
    const chat = await TripChat.findById(chatId);
    if (!chat) {
      throw new ChatNotFoundError("Chat not found");
    }

    // Get the trip and find the latest batch end date for this user
    const { Booking } = await import("../../models/bookings/booking.model.js");
    const { TripBatch } = await import("../../models/tripBatch/tripBatch.model.js");

    const booking = await Booking.findOne({
      user_id: senderId,
      trip_id: chat.tripId,
      payment_status: "PAID",
    }).sort({ createdAt: -1 });

    if (booking) {
      const batch = await TripBatch.findById(booking.batch_id);
      if (batch && batch.end_date) {
        const now = new Date();
        if (batch.end_date < now) {
          throw new UnauthorizedChatAccessError(
            "Chat has ended. Messages cannot be sent after the trip end date.",
          );
        }
      }
    }

    // Compute recipients based on sender role
    const visibleTo = await this.computeRecipients(chatId, sender.role, senderId);

    // Create message
    const message = await ChatMessage.create({
      chatId,
      senderId,
      senderRole: sender.role,
      messageType,
      content,
      metadata,
      visibleTo,
    });

    return message.populate("senderId", "name email profilePicture");
  }

  /**
   * Send system message (visible to all)
   */
  async sendSystemMessage(chatId: string, content: string): Promise<IChatMessage> {
    // Get all active participants
    const participants = await ChatParticipant.find({
      chatId,
      isActive: true,
      leftAt: null,
    });

    const visibleTo = participants.map((p) => p.userId);

    // System messages use a special system user ID (not a real user)
    const message = await ChatMessage.create({
      chatId,
      senderId: SYSTEM_USER_ID,
      senderRole: ParticipantRole.ADMIN,
      messageType: MessageType.SYSTEM,
      content,
      visibleTo,
    });

    return message;
  }

  /**
   * Get chat messages with visibility filtering
   */
  async getChatMessages(
    chatId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ messages: IChatMessage[]; total: number; hasMore: boolean }> {
    // Verify user is participant
    const participant = await ChatParticipant.findOne({
      chatId,
      userId,
      isActive: true,
    });

    if (!participant) {
      throw new UnauthorizedChatAccessError("Not a participant of this chat");
    }

    const skip = (page - 1) * limit;

    // Query messages where user is in visibleTo array
    const query = {
      chatId,
      deletedAt: null,
      visibleTo: userId,
    };

    const [messages, total] = await Promise.all([
      ChatMessage.find(query)
        .populate("senderId", "name email profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ChatMessage.countDocuments(query),
    ]);

    return {
      messages: messages.reverse(), // Return in chronological order
      total,
      hasMore: skip + messages.length < total,
    };
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    const participant = await ChatParticipant.findOne({
      chatId,
      userId,
      isActive: true,
    });

    if (!participant) {
      return 0;
    }

    const query: any = {
      chatId,
      deletedAt: null,
      visibleTo: userId,
      senderId: { $ne: userId }, // Exclude own messages
    };

    if (participant.lastReadAt) {
      query.createdAt = { $gt: participant.lastReadAt };
    }

    return ChatMessage.countDocuments(query);
  }

  /**
   * Mark messages as read
   */
  async markAsRead(chatId: string, userId: string): Promise<void> {
    await ChatParticipant.findOneAndUpdate(
      { chatId, userId, isActive: true },
      { lastReadAt: new Date() },
    );
  }

  /**
   * Verify user has access to chat
   */
  async verifyAccess(chatId: string, userId: string): Promise<boolean> {
    const participant = await ChatParticipant.findOne({
      chatId,
      userId,
      isActive: true,
      leftAt: null,
    });

    return !!participant;
  }

  /**
   * Get user's role in chat
   */
  async getUserRole(chatId: string, userId: string): Promise<ParticipantRole | null> {
    const participant = await ChatParticipant.findOne({
      chatId,
      userId,
      isActive: true,
    });

    return participant?.role || null;
  }

  /**
   * Get chat by trip ID
   */
  async getChatByTripId(tripId: string): Promise<ITripChat | null> {
    return TripChat.findOne({ tripId, deletedAt: null, isActive: true });
  }
}

export const chatService = new ChatService();
