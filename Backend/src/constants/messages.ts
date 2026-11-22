/**
 * Application Messages and Static Text
 */

export const MESSAGES = {
  // Success Messages
  SUCCESS: {
    OPERATION_SUCCESSFUL: "Operation completed successfully",
    CREATED: "Resource created successfully",
    UPDATED: "Resource updated successfully",
    DELETED: "Resource deleted successfully",
    FETCHED: "Data fetched successfully",
  },

  // Authentication Messages
  AUTH: {
    LOGIN_SUCCESS: "Login successful",
    LOGOUT_SUCCESS: "Logout successful",
    REGISTER_SUCCESS: "Registration successful",
    TOKEN_REFRESHED: "Token refreshed successfully",
    PASSWORD_RESET_SENT: "Password reset link sent to your email",
    PASSWORD_RESET_SUCCESS: "Password reset successful",
    EMAIL_VERIFIED: "Email verified successfully",
    INVALID_CREDENTIALS: "Invalid email or password",
    UNAUTHORIZED: "Unauthorized access",
    TOKEN_EXPIRED: "Token has expired",
    TOKEN_INVALID: "Invalid token",
    USER_NOT_FOUND: "User not found",
    USER_ALREADY_EXISTS: "User already exists",
    ACCOUNT_DISABLED: "Your account has been disabled",
    INSUFFICIENT_PERMISSIONS: "Insufficient permissions",
  },

  // Validation Messages
  VALIDATION: {
    REQUIRED_FIELD: "This field is required",
    INVALID_EMAIL: "Invalid email format",
    INVALID_PASSWORD: "Password must be at least 8 characters",
    PASSWORD_MISMATCH: "Passwords do not match",
    INVALID_FORMAT: "Invalid format",
    INVALID_INPUT: "Invalid input provided",
    FIELD_TOO_SHORT: "Field is too short",
    FIELD_TOO_LONG: "Field is too long",
    INVALID_DATE: "Invalid date format",
    INVALID_NUMBER: "Invalid number format",
  },

  // Error Messages
  ERROR: {
    INTERNAL_SERVER: "Internal server error",
    NOT_FOUND: "Resource not found",
    BAD_REQUEST: "Bad request",
    FORBIDDEN: "Access forbidden",
    CONFLICT: "Resource already exists",
    UNPROCESSABLE_ENTITY: "Unable to process request",
    TOO_MANY_REQUESTS: "Too many requests, please try again later",
    SERVICE_UNAVAILABLE: "Service temporarily unavailable",
    DATABASE_ERROR: "Database operation failed",
    NETWORK_ERROR: "Network error occurred",
  },

  // Database Messages
  DATABASE: {
    CONNECTION_SUCCESS: "Database connected successfully",
    CONNECTION_FAILED: "Database connection failed",
    QUERY_FAILED: "Database query failed",
    TRANSACTION_FAILED: "Transaction failed",
  },

  // File Upload Messages
  FILE: {
    UPLOAD_SUCCESS: "File uploaded successfully",
    UPLOAD_FAILED: "File upload failed",
    INVALID_FILE_TYPE: "Invalid file type",
    FILE_TOO_LARGE: "File size exceeds limit",
    FILE_NOT_FOUND: "File not found",
    DELETE_SUCCESS: "File deleted successfully",
  },

  // General Messages
  GENERAL: {
    WELCOME: "Welcome to The Tripping Project",
    GOODBYE: "Goodbye!",
    MAINTENANCE: "System is under maintenance",
    COMING_SOON: "Feature coming soon",
  },
} as const;

export default MESSAGES;
