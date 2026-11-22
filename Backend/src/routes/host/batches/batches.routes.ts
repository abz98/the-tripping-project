/**
 * Host Batch Routes
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/rbac.middleware.js";
import { batchService } from "../../../services/batches/batches.service.js";
import {
  BatchError,
  BatchValidationError,
  BatchNotFoundError,
  BatchForbiddenError,
} from "../../../services/batches/batches.errors.js";
import { HTTP_STATUS } from "../../../constants/statusCodes.js";
import { MESSAGES } from "../../../constants/messages.js";

const router = Router();

interface AuthenticatedRequest extends Request {
  user: { userId: string; role: string };
}

function handleBatchError(error: unknown, res: Response): void {
  if (error instanceof BatchValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: "error",
      message: error.message,
      error: { code: error.code, details: error.details },
    });
    return;
  }

  if (error instanceof BatchNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof BatchForbiddenError) {
    res.status(HTTP_STATUS.FORBIDDEN).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof BatchError) {
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

// Create Batch
router.post(
  "/host/trips/:tripId/batches",
  authenticate,
  authorize("USER"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const batch = await batchService.create(req.params.tripId, userId, req.body);
      res.status(HTTP_STATUS.CREATED).json({
        status: "success",
        message: MESSAGES.SUCCESS.CREATED,
        data: batch,
      });
    } catch (error) {
      handleBatchError(error, res);
    }
  },
);

// List Batches
router.get(
  "/host/trips/:tripId/batches",
  authenticate,
  authorize("USER"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const batches = await batchService.list(req.params.tripId, userId);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.FETCHED,
        data: batches,
      });
    } catch (error) {
      handleBatchError(error, res);
    }
  },
);

// Update Batch
router.put(
  "/host/batches/:id",
  authenticate,
  authorize("USER"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const batch = await batchService.update(req.params.id, userId, req.body);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.UPDATED,
        data: batch,
      });
    } catch (error) {
      handleBatchError(error, res);
    }
  },
);

// Close Batch
router.patch(
  "/host/batches/:id/close",
  authenticate,
  authorize("USER"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const batch = await batchService.close(req.params.id, userId);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.UPDATED,
        data: batch,
      });
    } catch (error) {
      handleBatchError(error, res);
    }
  },
);

export default router;
