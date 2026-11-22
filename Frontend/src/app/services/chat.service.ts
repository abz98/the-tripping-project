import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject } from "rxjs";
import { io, Socket } from "socket.io-client";
import { environment } from "../../environments/environment";
import { AuthService } from "./auth.service";

export interface UserChat {
  chatId: string;
  tripId: string;
  tripTitle: string;
  destination: string[];
  basePrice: number;
  role: "USER" | "HOST" | "ADMIN";
  joinedAt: string;
  lastReadAt: string | null;
  createdAt: string;
  isChatActive: boolean;
  chatEndsAt: string;
}

export interface MyChatsResponse {
  success: boolean;
  data: UserChat[];
  total: number;
}

export interface ChatMessage {
  _id: string;
  chatId: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  senderRole: "USER" | "HOST" | "ADMIN";
  content: string;
  messageType: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
  metadata?: any;
  createdAt: string;
  isEdited: boolean;
  editedAt?: string | null;
}

export interface ChatHistoryResponse {
  success: boolean;
  data: {
    messages: ChatMessage[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
}

export interface TypingUser {
  userId: string;
  userName: string;
  chatId: string;
}

@Injectable({
  providedIn: "root",
})
export class ChatService {
  private apiUrl = environment.apiBaseUrl;
  private socket: Socket | null = null;
  private connected = new BehaviorSubject<boolean>(false);
  public connected$ = this.connected.asObservable();

  // Observable streams
  private messagesSubject = new BehaviorSubject<{
    [chatId: string]: ChatMessage[];
  }>({});
  public messages$ = this.messagesSubject.asObservable();

  private typingUsersSubject = new BehaviorSubject<TypingUser[]>([]);
  public typingUsers$ = this.typingUsersSubject.asObservable();

  private unreadCountsSubject = new BehaviorSubject<{
    [chatId: string]: number;
  }>({});
  public unreadCounts$ = this.unreadCountsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  /**
   * Get all chats the user is part of
   */
  getMyChats(): Observable<MyChatsResponse> {
    return this.http.get<MyChatsResponse>(`${this.apiUrl}/chats/my-chats`);
  }

  /**
   * Get chat history with pagination
   */
  getChatHistory(
    chatId: string,
    page: number = 1,
    limit: number = 50,
  ): Observable<ChatHistoryResponse> {
    return this.http.get<ChatHistoryResponse>(
      `${this.apiUrl}/chats/${chatId}/messages?page=${page}&limit=${limit}`,
    );
  }

  /**
   * Connect to Socket.IO server
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log("Socket already connected");
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      console.error("No authentication token available");
      return;
    }

    const socketUrl =
      environment.apiBaseUrl.replace("/api/v1", "") || "http://localhost:3001";
    console.log("Connecting to socket server:", socketUrl);

    this.socket = io(socketUrl, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    });

    this.setupSocketListeners();
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      console.log("Connected to chat server:", this.socket?.id);
      this.connected.next(true);
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from chat server");
      this.connected.next(false);
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Chat events
    this.socket.on("joined:chat", (data) => {
      console.log("Joined chat:", data);
      if (data.unreadCount !== undefined) {
        const counts = this.unreadCountsSubject.value;
        counts[data.chatId] = data.unreadCount;
        this.unreadCountsSubject.next(counts);
      }
    });

    this.socket.on("new:message", (data) => {
      console.log("New message received:", data.message);
      this.addMessageToChat(data.message);
    });

    this.socket.on("message:sent", (data) => {
      console.log("Message sent confirmation:", data);
    });

    this.socket.on("user:typing", (data) => {
      console.log(`User typing:`, data);
      this.addTypingUser(data);
    });

    this.socket.on("user:stopped-typing", (data) => {
      console.log(`User stopped typing:`, data);
      this.removeTypingUser(data.userId, data.chatId);
    });

    this.socket.on("marked:read", (data) => {
      console.log("Messages marked as read:", data);
      const counts = this.unreadCountsSubject.value;
      counts[data.chatId] = 0;
      this.unreadCountsSubject.next(counts);
    });

    this.socket.on("participant:joined", (data) => {
      console.log("Participant joined:", data);
    });

    this.socket.on("participant:left", (data) => {
      console.log("Participant left:", data);
    });
  }

  /**
   * Join a specific chat room
   */
  joinChat(chatId: string): void {
    if (!this.socket?.connected) {
      console.error("Socket not connected");
      return;
    }
    console.log("Joining chat:", chatId);
    this.socket.emit("join:chat", { chatId });
  }

  /**
   * Send a message
   */
  sendMessage(
    chatId: string,
    content: string,
    messageType: string = "TEXT",
  ): void {
    if (!this.socket?.connected) {
      console.error("Socket not connected");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    console.log("Sending message:", { chatId, content, messageType, tempId });

    this.socket.emit("send:message", {
      chatId,
      content,
      messageType,
      metadata: { tempId },
    });
  }

  /**
   * Start typing indicator
   */
  startTyping(chatId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit("typing:start", { chatId });
  }

  /**
   * Stop typing indicator
   */
  stopTyping(chatId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit("typing:stop", { chatId });
  }

  /**
   * Mark messages as read
   */
  markAsRead(chatId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit("mark:read", { chatId });
  }

  /**
   * Disconnect from socket
   */
  disconnect(): void {
    if (this.socket) {
      console.log("Disconnecting socket");
      this.socket.disconnect();
      this.socket = null;
      this.connected.next(false);
    }
  }

  /**
   * Get messages for a specific chat
   */
  getMessagesForChat(chatId: string): ChatMessage[] {
    return this.messagesSubject.value[chatId] || [];
  }

  /**
   * Set messages for a specific chat (used when loading history)
   */
  setMessagesForChat(chatId: string, messages: ChatMessage[]): void {
    const allMessages = this.messagesSubject.value;
    allMessages[chatId] = messages;
    this.messagesSubject.next({ ...allMessages });
  }

  /**
   * Prepend older messages to chat (for pagination)
   */
  prependMessagesToChat(chatId: string, messages: ChatMessage[]): void {
    const allMessages = this.messagesSubject.value;
    const existingMessages = allMessages[chatId] || [];
    allMessages[chatId] = [...messages, ...existingMessages];
    this.messagesSubject.next({ ...allMessages });
  }

  /**
   * Add message to chat
   */
  private addMessageToChat(message: ChatMessage): void {
    const allMessages = this.messagesSubject.value;
    const chatMessages = allMessages[message.chatId] || [];
    chatMessages.push(message);
    allMessages[message.chatId] = chatMessages;
    this.messagesSubject.next({ ...allMessages });
  }

  /**
   * Add typing user
   */
  private addTypingUser(data: TypingUser): void {
    const typingUsers = this.typingUsersSubject.value;
    const exists = typingUsers.find(
      (u) => u.userId === data.userId && u.chatId === data.chatId,
    );
    if (!exists) {
      typingUsers.push(data);
      this.typingUsersSubject.next([...typingUsers]);
    }
  }

  /**
   * Remove typing user
   */
  private removeTypingUser(userId: string, chatId: string): void {
    const typingUsers = this.typingUsersSubject.value;
    const filtered = typingUsers.filter(
      (u) => !(u.userId === userId && u.chatId === chatId),
    );
    this.typingUsersSubject.next(filtered);
  }

  /**
   * Get typing users for a chat
   */
  getTypingUsersForChat(chatId: string): TypingUser[] {
    return this.typingUsersSubject.value.filter((u) => u.chatId === chatId);
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
