export class ChatNotFoundError extends Error {
  constructor(message = "Chat not found") {
    super(message);
    this.name = "ChatNotFoundError";
  }
}

export class UnauthorizedChatAccessError extends Error {
  constructor(message = "Unauthorized access to chat") {
    super(message);
    this.name = "UnauthorizedChatAccessError";
  }
}

export class InvalidParticipantError extends Error {
  constructor(message = "Invalid participant") {
    super(message);
    this.name = "InvalidParticipantError";
  }
}

export class MessageNotFoundError extends Error {
  constructor(message = "Message not found") {
    super(message);
    this.name = "MessageNotFoundError";
  }
}
