/**
 * Payment Routes
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { paymentService } from "../../services/payments/payments.service.js";
import {
  PaymentError,
  PaymentValidationError,
  PaymentNotFoundError,
  PaymentForbiddenError,
} from "../../services/payments/payments.errors.js";
import { HTTP_STATUS } from "../../constants/statusCodes.js";
import { MESSAGES } from "../../constants/messages.js";

const router = Router();

interface AuthenticatedRequest extends Request {
  user: { userId: string; role: string };
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof PaymentValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: "error",
      message: error.message,
      error: { code: error.code, details: error.details },
    });
    return;
  }

  if (error instanceof PaymentNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof PaymentForbiddenError) {
    res.status(HTTP_STATUS.FORBIDDEN).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof PaymentError) {
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

// Initiate Payment
router.post("/payments/initiate", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const payment = await paymentService.initiate(userId, req.body);
    res.status(HTTP_STATUS.CREATED).json({
      status: "success",
      message: MESSAGES.SUCCESS.CREATED,
      data: payment,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Payment Webhook (no auth - called by payment gateway)
router.post("/payments/webhook", async (req: Request, res: Response) => {
  try {
    // In production, verify webhook signature here
    const payment = await paymentService.handleWebhook(req.body);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      data: payment,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Payment Status
router.get("/payments/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const payment = await paymentService.getById(req.params.id, userId);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: payment,
    });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
