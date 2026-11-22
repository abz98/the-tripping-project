/**
 * Validators Index
 * Exports all validation functions and types
 */

export {
  validateRegister,
  validateLogin,
  validateRefresh,
  validateLogout,
  ValidationError,
  ValidationResult,
  RegisterRequestBody,
  LoginRequestBody,
  RefreshRequestBody,
  LogoutRequestBody,
} from "./auth.validator.js";

export { default as authValidator } from "./auth.validator.js";
