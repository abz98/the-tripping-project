import { Router, Request, Response } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { ChatParticipant } from "../../models/chatParticipant/chatParticipant.model";
import { TripChat } from "../../models/tripChat/tripChat.model";
import { Trip } from "../../models/trips/trips.model";
import { ChatMessage } from "../../models/chatMessage/chatMessage.model";

const router = Router();

/**
 * GET /api/v1/chats/my-chats
 * Get all chats for the authenticated user
 */
router.get("/chats/my-chats", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    // Find all chat participations for this user
    const participations = await ChatParticipant.find({
      userId,
      isActive: true,
      leftAt: null,
    }).sort({ joinedAt: -1 });

    if (participations.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No chats found",
      });
    }

    // Get chat IDs
    const chatIds = participations.map((p) => p.chatId);

    // Get all trip chats
    const tripChats = await TripChat.find({
      _id: { $in: chatIds },
      isActive: true,
      deletedAt: null,
    });

    // Get trip details
    const tripIds = tripChats.map((tc) => tc.tripId);
    const trips = await Trip.find({ _id: { $in: tripIds } }).select("title destination base_price");

    // Get bookings to find batch information
    const { Booking } = await import("../../models/bookings/booking.model.js");
    const { TripBatch } = await import("../../models/tripBatch/tripBatch.model.js");

    const bookings = await Booking.find({
      user_id: userId,
      trip_id: { $in: tripIds },
      payment_status: "PAID",
    }).select("batch_id trip_id");

    // Get all batch IDs
    const batchIds = bookings.map((b) => b.batch_id);
    const batches = await TripBatch.find({ _id: { $in: batchIds } }).select("trip_id end_date");

    // Create map of tripId -> latest batch end_date
    const tripBatchMap = new Map<string, Date>();
    batches.forEach((batch) => {
      const tripIdStr = batch.trip_id.toString();
      const existingDate = tripBatchMap.get(tripIdStr);
      if (!existingDate || batch.end_date > existingDate) {
        tripBatchMap.set(tripIdStr, batch.end_date);
      }
    });

    // Map trips by ID
    const tripMap = new Map(trips.map((t) => [t._id.toString(), t]));

    // Build response
    const now = new Date();
    const chats = tripChats.map((chat) => {
      const trip = tripMap.get(chat.tripId.toString());
      const participation = participations.find((p) => p.chatId.toString() === chat._id.toString());
      const batchEndDate = tripBatchMap.get(chat.tripId.toString());

      // Chat is active only if batch end date hasn't passed
      const isChatActive = batchEndDate ? batchEndDate > now : true;

      return {
        chatId: chat._id.toString(),
        tripId: chat.tripId.toString(),
        tripTitle: trip?.title || "Unknown Trip",
        destination: trip?.destination || [],
        basePrice: trip?.base_price,
        role: participation?.role,
        joinedAt: participation?.joinedAt,
        lastReadAt: participation?.lastReadAt,
        createdAt: chat.createdAt,
        isChatActive,
        chatEndsAt: batchEndDate || null,
      };
    });

    return res.status(200).json({
      success: true,
      data: chats,
      total: chats.length,
    });
  } catch (error: any) {
    console.error("Get my chats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch chats",
      error: error.message,
    });
  }
});

/**
 * GET /api/v1/chats/:chatId/messages
 * Get chat message history with pagination
 */
router.get("/chats/:chatId/messages", authenticate, async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = (req as any).user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    // Verify user is a participant in this chat
    const participation = await ChatParticipant.findOne({
      chatId,
      userId,
      isActive: true,
    });

    if (!participation) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant in this chat",
      });
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get messages where user is in visibleTo array
    const query = {
      chatId,
      deletedAt: null,
      visibleTo: userId,
    };

    const [messages, total] = await Promise.all([
      ChatMessage.find(query)
        .populate("senderId", "full_name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ChatMessage.countDocuments(query),
    ]);

    // Reverse to get chronological order
    const chronologicalMessages = messages.reverse();

    return res.status(200).json({
      success: true,
      data: {
        messages: chronologicalMessages.map((msg) => {
          // Handle system messages where senderId might be null after populate
          const isSystemMessage = !msg.senderId || msg.messageType === "SYSTEM";

          return {
            _id: msg._id.toString(),
            chatId: msg.chatId.toString(),
            sender: isSystemMessage
              ? {
                  _id: "000000000000000000000000",
                  name: "System",
                  email: "",
                }
              : {
                  _id: (msg.senderId as any)._id.toString(),
                  name: (msg.senderId as any).full_name || "Unknown",
                  email: (msg.senderId as any).email || "",
                },
            senderRole: msg.senderRole,
            messageType: msg.messageType,
            content: msg.content,
            metadata: msg.metadata,
            isEdited: msg.isEdited,
            editedAt: msg.editedAt,
            createdAt: msg.createdAt,
          };
        }),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + messages.length < total,
        },
      },
    });
  } catch (error: any) {
    console.error("Get chat messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
});

export default router;
