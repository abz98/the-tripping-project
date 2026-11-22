/**
 * Review Routes
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { reviewService } from "../../services/reviews/reviews.service.js";
import {
  ReviewError,
  ReviewValidationError,
  ReviewNotFoundError,
  ReviewForbiddenError,
} from "../../services/reviews/reviews.errors.js";
import { HTTP_STATUS } from "../../constants/statusCodes.js";
import { MESSAGES } from "../../constants/messages.js";

const router = Router();

interface AuthenticatedRequest extends Request {
  user: { userId: string; role: string };
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof ReviewValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: "error",
      message: error.message,
      error: { code: error.code, details: error.details },
    });
    return;
  }

  if (error instanceof ReviewNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof ReviewForbiddenError) {
    res.status(HTTP_STATUS.FORBIDDEN).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof ReviewError) {
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

// Submit Review
router.post("/reviews", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const review = await reviewService.create(userId, req.body);
    res.status(HTTP_STATUS.CREATED).json({
      status: "success",
      message: MESSAGES.SUCCESS.CREATED,
      data: review,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Update Review
router.put("/reviews/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const review = await reviewService.update(req.params.id, userId, req.body);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.UPDATED,
      data: review,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Delete Review
router.delete("/reviews/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    await reviewService.delete(req.params.id, userId);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.DELETED,
    });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
