import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  OnDestroy,
} from "@angular/core";
import {
  ChatService,
  UserChat,
  ChatMessage,
  TypingUser,
} from "../../services/chat.service";
import { AuthService } from "../../services/auth.service";
import { Subscription } from "rxjs";

interface ChatGroup {
  id: string;
  tripId: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  color: string;
  members: number;
  role: "USER" | "HOST" | "ADMIN";
  destination: string[];
  basePrice: number;
  isChatActive: boolean;
  chatEndsAt: string;
}

interface DisplayMessage {
  _id: string;
  text: string;
  sender: string;
  senderId: string;
  senderRole: string;
  time: string;
  isSent: boolean;
  messageType: string;
  status?: "sent" | "delivered" | "read";
}

@Component({
  selector: "app-trip-chat",
  standalone: false,
  templateUrl: "./trip-chat.html",
  styleUrl: "./trip-chat.css",
})
export class TripChat implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild("messagesContainer") private messagesContainer!: ElementRef;
  @ViewChild("messageInput") private messageInput!: ElementRef;

  searchQuery: string = "";
  newMessage: string = "";
  selectedGroup: ChatGroup | null = null;

  chatGroups: ChatGroup[] = [];
  filteredChatGroups: ChatGroup[] = [];
  messages: DisplayMessage[] = [];
  typingUsers: TypingUser[] = [];

  isLoading: boolean = false;
  isLoadingMessages: boolean = false;
  isConnected: boolean = false;
  error: string = "";
  currentUserId: string = "";

  // Pagination
  currentPage: number = 1;
  hasMoreMessages: boolean = false;
  totalMessages: number = 0;

  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = false;
  private typingTimeout: any;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    // Get current user ID
    const tokenData = this.authService.getTokenData();
    this.currentUserId = tokenData?.userId || tokenData?.id || "";

    // Connect to socket
    this.chatService.connect();

    // Subscribe to connection status
    const connectedSub = this.chatService.connected$.subscribe((connected) => {
      this.isConnected = connected;
      console.log("Socket connection status:", connected);
    });
    this.subscriptions.push(connectedSub);

    // Subscribe to messages (only for active chats)
    const messagesSub = this.chatService.messages$.subscribe((allMessages) => {
      if (this.selectedGroup && this.selectedGroup.isChatActive) {
        const chatMessages = allMessages[this.selectedGroup.id] || [];
        this.messages = chatMessages.map((msg) => this.transformMessage(msg));
        this.shouldScrollToBottom = true;

        // Update last message in sidebar
        if (chatMessages.length > 0) {
          const lastMsg = chatMessages[chatMessages.length - 1];
          this.selectedGroup.lastMessage = lastMsg.content.substring(0, 50);
          this.selectedGroup.lastMessageTime = "Just now";
        }
      }
    });
    this.subscriptions.push(messagesSub);

    // Subscribe to typing users (only for active chats)
    const typingSub = this.chatService.typingUsers$.subscribe((users) => {
      if (this.selectedGroup && this.selectedGroup.isChatActive) {
        this.typingUsers = users.filter(
          (u) =>
            u.chatId === this.selectedGroup!.id &&
            u.userId !== this.currentUserId,
        );
      }
    });
    this.subscriptions.push(typingSub);

    // Subscribe to unread counts
    const unreadSub = this.chatService.unreadCounts$.subscribe((counts) => {
      this.chatGroups.forEach((group) => {
        if (counts[group.id] !== undefined) {
          group.unreadCount = counts[group.id];
        }
      });
    });
    this.subscriptions.push(unreadSub);

    // Load user chats
    this.loadUserChats();
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    // Disconnect socket
    this.chatService.disconnect();

    // Clear typing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  loadUserChats() {
    this.isLoading = true;
    this.error = "";

    this.chatService.getMyChats().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.chatGroups = response.data.map((chat, index) =>
            this.transformChatToGroup(chat, index),
          );
          this.filteredChatGroups = [...this.chatGroups];
          this.isLoading = false;

          // Auto-select first chat group and join it
          if (this.chatGroups.length > 0) {
            this.selectGroup(this.chatGroups[0]);
          }
        }
      },
      error: (error) => {
        console.error("Error loading chats:", error);
        this.error = "Failed to load chats. Please try again.";
        this.isLoading = false;
      },
    });
  }

  private transformChatToGroup(chat: UserChat, index: number): ChatGroup {
    const colors = [
      "#0d9488",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#ef4444",
      "#06b6d4",
      "#10b981",
      "#f97316",
    ];

    return {
      id: chat.chatId,
      tripId: chat.tripId,
      name: chat.tripTitle,
      lastMessage: this.getLastMessagePreview(chat),
      lastMessageTime: this.formatTimeAgo(chat.lastReadAt || chat.joinedAt),
      unreadCount: 0,
      color: colors[index % colors.length],
      members: 0,
      role: chat.role,
      destination: chat.destination,
      basePrice: chat.basePrice,
      isChatActive: chat.isChatActive,
      chatEndsAt: chat.chatEndsAt,
    };
  }

  private transformMessage(msg: ChatMessage): DisplayMessage {
    return {
      _id: msg._id,
      text: msg.content,
      sender: msg.sender.name,
      senderId: msg.sender._id,
      senderRole: msg.senderRole,
      time: this.formatTime(msg.createdAt),
      isSent: msg.sender._id === this.currentUserId,
      messageType: msg.messageType,
      status: "sent", // Default status, can be updated based on backend data
    };
  }

  private getLastMessagePreview(chat: UserChat): string {
    if (chat.role === "HOST") {
      return "You are hosting this trip";
    } else if (chat.role === "ADMIN") {
      return "Admin access";
    } else {
      return "Click to view messages";
    }
  }

  private formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

    return date.toLocaleDateString();
  }

  private formatTime(dateString: string): string {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? "0" + minutes : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  }

  filterChats() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.filteredChatGroups = [...this.chatGroups];
    } else {
      this.filteredChatGroups = this.chatGroups.filter(
        (group) =>
          group.name.toLowerCase().includes(query) ||
          group.destination.some((d) => d.toLowerCase().includes(query)) ||
          group.lastMessage.toLowerCase().includes(query),
      );
    }
  }

  selectGroup(group: ChatGroup) {
    this.selectedGroup = group;
    group.unreadCount = 0;

    // Reset pagination
    this.currentPage = 1;
    this.hasMoreMessages = false;
    this.messages = [];

    // Load chat history first
    this.loadChatHistory(group.id);

    // Only join socket room and mark as read if chat is active
    if (group.isChatActive) {
      // Join the chat room via socket
      this.chatService.joinChat(group.id);

      // Mark messages as read
      this.chatService.markAsRead(group.id);
    }

    this.shouldScrollToBottom = true;
  }

  loadChatHistory(chatId: string, page: number = 1) {
    this.isLoadingMessages = true;

    this.chatService.getChatHistory(chatId, page, 50).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const messages = response.data.messages;

          if (page === 1) {
            // First load - set messages directly (don't use socket state for inactive chats)
            if (this.selectedGroup && !this.selectedGroup.isChatActive) {
              // For inactive chats, display messages directly without socket state
              this.messages = messages.map((msg) => this.transformMessage(msg));
            } else {
              // For active chats, use socket state
              this.chatService.setMessagesForChat(chatId, messages);
            }
          } else {
            // Load more - prepend older messages
            if (this.selectedGroup && !this.selectedGroup.isChatActive) {
              // For inactive chats, prepend directly
              this.messages = [
                ...messages.map((msg) => this.transformMessage(msg)),
                ...this.messages,
              ];
            } else {
              // For active chats, use socket state
              this.chatService.prependMessagesToChat(chatId, messages);
            }
          }

          // Update pagination info
          this.currentPage = response.data.pagination.page;
          this.hasMoreMessages = response.data.pagination.hasMore;
          this.totalMessages = response.data.pagination.total;

          this.isLoadingMessages = false;

          if (page === 1) {
            this.shouldScrollToBottom = true;
          }
        }
      },
      error: (error) => {
        console.error("Error loading chat history:", error);
        this.isLoadingMessages = false;
      },
    });
  }

  loadMoreMessages() {
    if (
      !this.selectedGroup ||
      this.isLoadingMessages ||
      !this.hasMoreMessages
    ) {
      return;
    }

    const nextPage = this.currentPage + 1;
    this.loadChatHistory(this.selectedGroup.id, nextPage);
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedGroup || !this.isConnected) {
      console.warn("Cannot send message:", {
        hasMessage: !!this.newMessage.trim(),
        hasGroup: !!this.selectedGroup,
        isConnected: this.isConnected,
      });
      return;
    }

    // Check if chat is active
    if (!this.selectedGroup.isChatActive) {
      console.warn("Chat is not active");
      return;
    }

    // Send message via socket
    this.chatService.sendMessage(this.selectedGroup.id, this.newMessage.trim());

    this.newMessage = "";
    this.shouldScrollToBottom = true;

    // Stop typing indicator
    if (this.selectedGroup) {
      this.chatService.stopTyping(this.selectedGroup.id);
    }
  }

  onTyping() {
    if (
      !this.selectedGroup ||
      !this.isConnected ||
      !this.selectedGroup.isChatActive
    )
      return;

    // Send typing indicator
    this.chatService.startTyping(this.selectedGroup.id);

    // Clear previous timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Stop typing after 2 seconds of inactivity
    this.typingTimeout = setTimeout(() => {
      if (this.selectedGroup) {
        this.chatService.stopTyping(this.selectedGroup.id);
      }
    }, 2000);
  }

  getTypingText(): string {
    if (this.typingUsers.length === 0) return "";
    if (this.typingUsers.length === 1)
      return `${this.typingUsers[0].userName} is typing...`;
    if (this.typingUsers.length === 2)
      return `${this.typingUsers[0].userName} and ${this.typingUsers[1].userName} are typing...`;
    return `${this.typingUsers.length} people are typing...`;
  }

  getRoleBadge(role: string): string {
    switch (role) {
      case "HOST":
        return "👑 Host";
      case "ADMIN":
        return "⚡ Admin";
      case "USER":
        return "👤 Member";
      default:
        return "";
    }
  }

  getChatStatusText(): string {
    if (!this.selectedGroup) return "";

    if (!this.selectedGroup.isChatActive) {
      const endDate = new Date(this.selectedGroup.chatEndsAt);
      return `Chat ended on ${endDate.toLocaleDateString()}`;
    }

    return "";
  }

  isChatInputDisabled(): boolean {
    return (
      !this.selectedGroup ||
      !this.isConnected ||
      !this.selectedGroup.isChatActive
    );
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error("Scroll error:", err);
    }
  }
}
