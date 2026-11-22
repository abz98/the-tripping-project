/**
 * Application-wide Constants
 */

export const APP_CONSTANTS = {
  // Application Info
  APP_NAME: "The Tripping Project",
  APP_VERSION: "1.0.0",
  APP_DESCRIPTION: "Travel and trip management application",

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // Date Formats
  DATE_FORMATS: {
    ISO: "YYYY-MM-DDTHH:mm:ss.SSSZ",
    DATE_ONLY: "YYYY-MM-DD",
    TIME_ONLY: "HH:mm:ss",
    DISPLAY: "DD/MM/YYYY",
    DISPLAY_WITH_TIME: "DD/MM/YYYY HH:mm",
  },

  // User Roles
  ROLES: {
    ADMIN: "admin",
    USER: "user",
    MODERATOR: "moderator",
    GUEST: "guest",
  },

  // User Status
  USER_STATUS: {
    ACTIVE: "active",
    INACTIVE: "inactive",
    SUSPENDED: "suspended",
    PENDING: "pending",
  },

  // Request Status
  REQUEST_STATUS: {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    CANCELLED: "cancelled",
  },

  // File Types
  ALLOWED_FILE_TYPES: {
    IMAGES: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    DOCUMENTS: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    ALL: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ],
  },

  // Cache Keys
  CACHE_KEYS: {
    USER_PREFIX: "user:",
    SESSION_PREFIX: "session:",
    TOKEN_PREFIX: "token:",
  },

  // Cache TTL (in seconds)
  CACHE_TTL: {
    SHORT: 300, // 5 minutes
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },

  // Regex Patterns
  REGEX: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD:
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    PHONE: /^\+?[\d\s-()]+$/,
    URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  },

  // Error Codes
  ERROR_CODES: {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
    NOT_FOUND_ERROR: "NOT_FOUND_ERROR",
    CONFLICT_ERROR: "CONFLICT_ERROR",
    INTERNAL_ERROR: "INTERNAL_ERROR",
    DATABASE_ERROR: "DATABASE_ERROR",
    EXTERNAL_API_ERROR: "EXTERNAL_API_ERROR",
  },

  // Time Constants (in milliseconds)
  TIME: {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
  },
} as const;

export default APP_CONSTANTS;
