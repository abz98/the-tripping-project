import { chatService } from "./chat.service";
import { ParticipantRole } from "../../models/chatParticipant/chatParticipant.model";

/**
 * Service to handle chat integration with payment flow
 */
export class PaymentChatIntegrationService {
  /**
   * Called after successful payment confirmation
   * Creates chat group if needed and adds user as participant
   */
  async onPaymentSuccess(
    tripId: string,
    userId: string,
    userName: string,
    hostId: string,
  ): Promise<void> {
    try {
      // Step 1: Get or create trip chat
      const chat = await chatService.getOrCreateTripChat(tripId);

      // Step 2: Add host if not already added
      await chatService.addParticipant(chat._id.toString(), hostId, ParticipantRole.HOST);

      // Step 3: Add user as participant
      await chatService.addParticipant(chat._id.toString(), userId, ParticipantRole.USER);

      // Step 4: Add all admin users to the chat
      const { User } = await import("../../models/users/users.model.js");
      const adminUsers = await User.find({ role: "ADMIN" }).select("_id");

      for (const admin of adminUsers) {
        await chatService.addParticipant(
          chat._id.toString(),
          admin._id.toString(),
          ParticipantRole.ADMIN,
        );
      }

      // Step 5: Send system message
      await chatService.sendSystemMessage(chat._id.toString(), `${userName} joined the trip chat`);

      // Step 6: Notify via Socket.IO if service is initialized
      try {
        const { getSocketService } = await import("../socket/socket.service.js");
        try {
          const socketService = getSocketService();
          await socketService.addUserToChat(chat._id.toString(), userId, userName);
          console.log(`✓ Socket notification sent for user ${userId} joining chat`);
        } catch (serviceError) {
          // Socket service not initialized - this is okay, chat still works via REST API
          // Real-time notifications disabled, users can still use REST API for messages
        }
      } catch (importError) {
        // Socket module not available - this is expected if Socket.IO is not set up
      }

      console.log(`User ${userId} added to chat for trip ${tripId} after payment`);
    } catch (error) {
      console.error("Error in payment chat integration:", error);
      // Don't throw - chat creation failure shouldn't block payment
    }
  }

  /**
   * Called when user cancels booking or gets refund
   */
  async onBookingCancellation(tripId: string, userId: string, userName: string): Promise<void> {
    try {
      const chat = await chatService.getChatByTripId(tripId);

      if (!chat) {
        console.warn(`No chat found for trip ${tripId}`);
        return;
      }

      // Remove user from chat
      await chatService.removeParticipant(chat._id.toString(), userId);

      // Send system message
      await chatService.sendSystemMessage(chat._id.toString(), `${userName} left the trip chat`);

      // Notify via Socket.IO
      try {
        const { getSocketService } = await import("../socket/socket.service.js");
        try {
          const socketService = getSocketService();
          await socketService.removeUserFromChat(chat._id.toString(), userId, userName);
          console.log(`✓ Socket notification sent for user ${userId} leaving chat`);
        } catch (serviceError) {
          // Socket service not initialized - chat still works via REST API
        }
      } catch (importError) {
        // Socket module not available - this is expected
      }

      console.log(`User ${userId} removed from chat for trip ${tripId}`);
    } catch (error) {
      console.error("Error in booking cancellation chat integration:", error);
    }
  }

  /**
   * Add admin to trip chat
   */
  async addAdminToChat(tripId: string, adminId: string, adminName: string): Promise<void> {
    try {
      const chat = await chatService.getChatByTripId(tripId);

      if (!chat) {
        throw new Error("Chat not found for this trip");
      }

      await chatService.addParticipant(chat._id.toString(), adminId, ParticipantRole.ADMIN);

      await chatService.sendSystemMessage(
        chat._id.toString(),
        `Admin ${adminName} joined the chat`,
      );

      console.log(`Admin ${adminId} added to chat for trip ${tripId}`);
    } catch (error) {
      console.error("Error adding admin to chat:", error);
      throw error;
    }
  }

  /**
   * Handle host change for a trip
   */
  async onHostChange(
    tripId: string,
    oldHostId: string,
    newHostId: string,
    newHostName: string,
  ): Promise<void> {
    try {
      const chat = await chatService.getChatByTripId(tripId);

      if (!chat) {
        console.warn(`No chat found for trip ${tripId}`);
        return;
      }

      // Remove old host
      await chatService.removeParticipant(chat._id.toString(), oldHostId);

      // Add new host
      await chatService.addParticipant(chat._id.toString(), newHostId, ParticipantRole.HOST);

      // Send system message
      await chatService.sendSystemMessage(
        chat._id.toString(),
        `Trip host changed to ${newHostName}`,
      );

      console.log(`Host changed for trip ${tripId} chat`);
    } catch (error) {
      console.error("Error in host change chat integration:", error);
    }
  }
}

export const paymentChatIntegrationService = new PaymentChatIntegrationService();
