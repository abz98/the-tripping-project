/**
 * Auth Routes
 * Handles authentication endpoints
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { authService } from "../../services/auth/auth.service.js";
import {
  ValidationError,
  ConflictError,
  NotFoundError,
  AuthenticationError,
} from "../../services/auth/auth.errors.js";
import { HTTP_STATUS } from "../../constants/statusCodes.js";
import { MESSAGES } from "../../constants/messages.js";

const router = Router();

interface AuthenticatedRequest extends Request {
  user: { userId: string; role: string };
}

function handleAuthError(error: unknown, res: Response): void {
  if (error instanceof ValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: "error",
      message: error.message,
      error: { code: error.code, details: error.details },
    });
    return;
  }

  if (error instanceof ConflictError) {
    res.status(HTTP_STATUS.CONFLICT).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof NotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof AuthenticationError) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    status: "error",
    message: MESSAGES.ERROR.INTERNAL_SERVER,
    error: { code: "INTERNAL_ERROR" },
  });
}

// User Signup - POST /auth/register
router.post("/auth/register", async (req: Request, res: Response) => {
  try {
    const user = await authService.register(req.body);
    res.status(HTTP_STATUS.CREATED).json({
      status: "success",
      message: MESSAGES.AUTH.REGISTER_SUCCESS,
      data: user,
    });
  } catch (error) {
    handleAuthError(error, res);
  }
});

// User Login - POST /auth/login
router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const tokens = await authService.login(req.body);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.AUTH.LOGIN_SUCCESS,
      data: tokens,
    });
  } catch (error) {
    handleAuthError(error, res);
  }
});

// Refresh Token - POST /auth/refresh
router.post("/auth/refresh", authenticate, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.AUTH.TOKEN_REFRESHED,
      data: tokens,
    });
  } catch (error) {
    handleAuthError(error, res);
  }
});

// Logout - POST /auth/logout
router.post("/auth/logout", authenticate, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.AUTH.LOGOUT_SUCCESS,
    });
  } catch (error) {
    handleAuthError(error, res);
  }
});

// Verify Email - POST /auth/verify-email
router.post("/auth/verify-email", async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    await authService.verifyEmail(email, otp);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.AUTH.EMAIL_VERIFIED,
    });
  } catch (error) {
    handleAuthError(error, res);
  }
});

// OTP Verify - POST /auth/otpVerify
router.post("/auth/otpVerify", async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    await authService.verifyEmail(email, otp);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: "OTP verified successfully. Email verified.",
      data: {
        email,
        is_verified: true,
      },
    });
  } catch (error) {
    handleAuthError(error, res);
  }
});

// Forgot Password - POST /auth/forgot-password
router.post("/auth/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: "Password reset OTP sent to your email address",
      data: {
        email,
      },
    });
  } catch (error) {
    handleAuthError(error, res);
  }
});

// Reset Password - POST /auth/reset-password
router.post("/auth/reset-password", async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    await authService.resetPassword(email, otp, newPassword);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: "Password reset successfully",
      data: {
        email,
      },
    });
  } catch (error) {
    handleAuthError(error, res);
  }
});

export default router;
