import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { chatService } from "../chat/chat.service";
import { ParticipantRole } from "../../models/chatParticipant/chatParticipant.model";
import { MessageType } from "../../models/chatMessage/chatMessage.model";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface SendMessagePayload {
  chatId: string;
  content: string;
  messageType?: MessageType;
  metadata?: any;
}

export class SocketService {
  private io: SocketIOServer;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  /**
   * JWT Authentication Middleware
   */
  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.userId = decoded.userId || decoded.id;
        socket.userRole = decoded.role;

        next();
      } catch (error) {
        next(new Error("Invalid authentication token"));
      }
    });
  }

  /**
   * Setup Socket Event Handlers
   */
  private setupEventHandlers() {
    this.io.on("connection", (socket: AuthenticatedSocket) => {
      console.log(`\n🔌 [Socket.IO] User connected`);
      console.log(`   └─ User ID: ${socket.userId}`);
      console.log(`   └─ Socket ID: ${socket.id}`);
      console.log(`   └─ Role: ${socket.userRole}`);

      // Join chat room
      socket.on("join:chat", async (data: { chatId: string }) => {
        console.log(`📥 [join:chat] User ${socket.userId} joining chat ${data.chatId}`);
        await this.handleJoinChat(socket, data.chatId);
      });

      // Leave chat room
      socket.on("leave:chat", (data: { chatId: string }) => {
        console.log(`📤 [leave:chat] User ${socket.userId} leaving chat ${data.chatId}`);
        this.handleLeaveChat(socket, data.chatId);
      });

      // Send message
      socket.on("send:message", async (data: SendMessagePayload) => {
        console.log(
          `💬 [send:message] User ${socket.userId} sending message to chat ${data.chatId}`,
        );
        await this.handleSendMessage(socket, data);
      });

      // Typing indicator
      socket.on("typing:start", (data: { chatId: string }) => {
        this.handleTypingStart(socket, data.chatId);
      });

      socket.on("typing:stop", (data: { chatId: string }) => {
        this.handleTypingStop(socket, data.chatId);
      });

      // Mark as read
      socket.on("mark:read", async (data: { chatId: string }) => {
        await this.handleMarkAsRead(socket, data.chatId);
      });

      // Disconnect
      socket.on("disconnect", () => {
        console.log(`\n🔌 [Socket.IO] User disconnected`);
        console.log(`   └─ User ID: ${socket.userId}`);
        console.log(`   └─ Socket ID: ${socket.id}`);
      });
    });
  }

  /**
   * Handle user joining a chat room
   */
  private async handleJoinChat(socket: AuthenticatedSocket, chatId: string) {
    try {
      if (!socket.userId) return;

      // Verify user has access to this chat
      const hasAccess = await chatService.verifyAccess(chatId, socket.userId);

      if (!hasAccess) {
        socket.emit("error", {
          message: "Unauthorized access to chat",
          code: "UNAUTHORIZED",
        });
        return;
      }

      // Join the room
      const roomName = `trip:${chatId}`;
      socket.join(roomName);

      // Get unread count
      const unreadCount = await chatService.getUnreadCount(chatId, socket.userId);

      socket.emit("joined:chat", {
        chatId,
        roomName,
        unreadCount,
      });

      console.log(
        `✅ [join:chat] User ${socket.userId} successfully joined room ${roomName} (${unreadCount} unread)`,
      );
    } catch (error: any) {
      socket.emit("error", {
        message: error.message,
        code: "JOIN_CHAT_ERROR",
      });
    }
  }

  /**
   * Handle user leaving a chat room
   */
  private handleLeaveChat(socket: AuthenticatedSocket, chatId: string) {
    const roomName = `trip:${chatId}`;
    socket.leave(roomName);
    console.log(`✅ [leave:chat] User ${socket.userId} left room ${roomName}`);
    console.log(`User ${socket.userId} left room ${roomName}`);
  }

  /**
   * Handle sending a message with role-based visibility
   */
  private async handleSendMessage(socket: AuthenticatedSocket, data: SendMessagePayload) {
    try {
      if (!socket.userId) return;

      const { chatId, content, messageType, metadata } = data;

      // Send message (visibility computed in service)
      // This will throw an error if chat has ended
      const message = await chatService.sendMessage(
        chatId,
        socket.userId,
        content,
        messageType,
        metadata,
      );

      console.log(`✅ [send:message] Message saved to DB - ID: ${message._id}`);

      // Get sender's role to determine emission strategy
      const senderRole = await chatService.getUserRole(chatId, socket.userId);

      if (!senderRole) {
        throw new Error("Sender role not found");
      }

      // Emit to appropriate recipients based on role
      await this.emitMessageToRecipients(chatId, message, senderRole);

      // Acknowledge to sender
      socket.emit("message:sent", {
        messageId: message._id,
        tempId: data.metadata?.tempId, // For client-side optimistic updates
      });

      console.log(`✅ [send:message] Message broadcast complete - Recipients notified`);
    } catch (error: any) {
      console.error(`❌ [send:message] Error:`, error.message);
      socket.emit("error", {
        message: error.message,
        code: error.message.includes("ended") ? "CHAT_ENDED" : "SEND_MESSAGE_ERROR",
      });
    }
  }

  /**
   * CRITICAL: Emit message to correct recipients based on sender role
   */
  private async emitMessageToRecipients(chatId: string, message: any, senderRole: ParticipantRole) {
    const roomName = `trip:${chatId}`;
    const participants = await chatService.getChatParticipants(chatId);

    // Get all connected sockets in this room
    const socketsInRoom = await this.io.in(roomName).fetchSockets();

    for (const socket of socketsInRoom) {
      const socketUserId = (socket as any).userId;

      // Check if this socket's user should receive the message
      const shouldReceive = message.visibleTo.some((id: any) => id.toString() === socketUserId);

      if (shouldReceive) {
        socket.emit("new:message", {
          message: {
            _id: message._id,
            chatId: message.chatId,
            sender: message.senderId,
            senderRole: message.senderRole,
            content: message.content,
            messageType: message.messageType,
            metadata: message.metadata,
            createdAt: message.createdAt,
            isEdited: message.isEdited,
          },
        });
      }
    }
  }

  /**
   * Handle typing indicator start
   */
  private handleTypingStart(socket: AuthenticatedSocket, chatId: string) {
    if (!socket.userId) return;

    const roomName = `trip:${chatId}`;
    socket.to(roomName).emit("user:typing", {
      userId: socket.userId,
      chatId,
    });
  }

  /**
   * Handle typing indicator stop
   */
  private handleTypingStop(socket: AuthenticatedSocket, chatId: string) {
    if (!socket.userId) return;

    const roomName = `trip:${chatId}`;
    socket.to(roomName).emit("user:stopped-typing", {
      userId: socket.userId,
      chatId,
    });
  }

  /**
   * Handle mark as read
   */
  private async handleMarkAsRead(socket: AuthenticatedSocket, chatId: string) {
    try {
      if (!socket.userId) return;

      await chatService.markAsRead(chatId, socket.userId);

      socket.emit("marked:read", { chatId });
    } catch (error: any) {
      socket.emit("error", {
        message: error.message,
        code: "MARK_READ_ERROR",
      });
    }
  }

  /**
   * Public method to join user to chat (called after payment)
   */
  async addUserToChat(chatId: string, userId: string, userName: string): Promise<void> {
    const roomName = `trip:${chatId}`;

    // Send system message
    await chatService.sendSystemMessage(chatId, `${userName} joined the trip chat`);

    // Notify all users in the room
    this.io.to(roomName).emit("participant:joined", {
      chatId,
      userId,
      userName,
    });
  }

  /**
   * Public method to remove user from chat
   */
  async removeUserFromChat(chatId: string, userId: string, userName: string): Promise<void> {
    const roomName = `trip:${chatId}`;

    // Send system message
    await chatService.sendSystemMessage(chatId, `${userName} left the trip chat`);

    // Notify all users in the room
    this.io.to(roomName).emit("participant:left", {
      chatId,
      userId,
      userName,
    });
  }

  /**
   * Get Socket.IO instance
   */
  getIO(): SocketIOServer {
    return this.io;
  }
}

let socketService: SocketService;

export const initializeSocketService = (server: HTTPServer): SocketService => {
  socketService = new SocketService(server);
  return socketService;
};

export const getSocketService = (): SocketService => {
  if (!socketService) {
    throw new Error("Socket service not initialized");
  }
  return socketService;
};
