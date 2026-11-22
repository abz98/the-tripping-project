/**
 * Auth Service
 * Handles authentication business logic including registration, login, logout, and token refresh
 */

export {
  authService,
  type IAuthService,
  type RegisterDTO,
  type LoginDTO,
  type AuthTokens,
  type UserResponse,
} from "./auth.service.js";
export {
  AuthError,
  ValidationError,
  ConflictError,
  AuthenticationError,
  NotFoundError,
} from "./auth.errors.js";
