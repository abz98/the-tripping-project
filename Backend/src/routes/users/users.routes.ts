/**
 * User Routes
 * Handles user profile endpoints
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { userService } from "../../services/users/users.service.js";
import {
  UserError,
  UserValidationError,
  UserNotFoundError,
  UserAuthenticationError,
} from "../../services/users/users.errors.js";
import { HTTP_STATUS } from "../../constants/statusCodes.js";
import { MESSAGES } from "../../constants/messages.js";

const router = Router();

interface AuthenticatedRequest extends Request {
  user: { userId: string; role: string };
}

function handleUserError(error: unknown, res: Response): void {
  if (error instanceof UserValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: "error",
      message: error.message,
      error: { code: error.code, details: error.details },
    });
    return;
  }

  if (error instanceof UserNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof UserAuthenticationError) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof UserError) {
    res.status(error.statusCode).json({
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

// Get Profile - GET /users/me
router.get("/users/me", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const profile = await userService.getProfile(userId);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: profile,
    });
  } catch (error) {
    handleUserError(error, res);
  }
});

// Update Profile - PUT /users/me
router.put("/users/me", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const profile = await userService.updateProfile(userId, req.body);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.UPDATED,
      data: profile,
    });
  } catch (error) {
    handleUserError(error, res);
  }
});

// Change Password - PUT /users/change-password
router.put("/users/change-password", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    await userService.changePassword(userId, req.body);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.UPDATED,
    });
  } catch (error) {
    handleUserError(error, res);
  }
});

export default router;
