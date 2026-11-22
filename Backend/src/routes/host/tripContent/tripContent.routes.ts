/**
 * Host Trip Content Routes - Itinerary, Inclusions, Media
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/rbac.middleware.js";
import { tripContentService } from "../../../services/tripContent/tripContent.service.js";
import {
  TripContentError,
  TripContentValidationError,
  TripContentNotFoundError,
  TripContentForbiddenError,
} from "../../../services/tripContent/tripContent.errors.js";
import { HTTP_STATUS } from "../../../constants/statusCodes.js";
import { MESSAGES } from "../../../constants/messages.js";

const router = Router();

interface AuthenticatedRequest extends Request {
  user: { userId: string; role: string };
}

function handleError(error: unknown, res: Response): void {
  if (error instanceof TripContentValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: "error",
      message: error.message,
      error: { code: error.code, details: error.details },
    });
    return;
  }

  if (error instanceof TripContentNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof TripContentForbiddenError) {
    res.status(HTTP_STATUS.FORBIDDEN).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof TripContentError) {
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

// Add Itinerary
router.post(
  "/host/trips/:tripId/itinerary",
  authenticate,
  authorize("USER"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const itinerary = await tripContentService.addItinerary(req.params.tripId, userId, req.body);
      res.status(HTTP_STATUS.CREATED).json({
        status: "success",
        message: MESSAGES.SUCCESS.CREATED,
        data: itinerary,
      });
    } catch (error) {
      handleError(error, res);
    }
  },
);

// Update Itinerary
router.put(
  "/host/itinerary/:id",
  authenticate,
  authorize("USER"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const itinerary = await tripContentService.updateItinerary(req.params.id, userId, req.body);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.UPDATED,
        data: itinerary,
      });
    } catch (error) {
      handleError(error, res);
    }
  },
);

// Add Inclusion/Exclusion
router.post(
  "/host/trips/:tripId/inclusions",
  authenticate,
  authorize("USER"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const inclusion = await tripContentService.addInclusion(req.params.tripId, userId, req.body);
      res.status(HTTP_STATUS.CREATED).json({
        status: "success",
        message: MESSAGES.SUCCESS.CREATED,
        data: inclusion,
      });
    } catch (error) {
      handleError(error, res);
    }
  },
);

// Upload Media
router.post(
  "/host/trips/:tripId/media",
  authenticate,
  authorize("USER"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const media = await tripContentService.uploadMedia(req.params.tripId, userId, req.body);
      res.status(HTTP_STATUS.CREATED).json({
        status: "success",
        message: MESSAGES.SUCCESS.CREATED,
        data: media,
      });
    } catch (error) {
      handleError(error, res);
    }
  },
);

// Delete Media
router.delete(
  "/host/media/:id",
  authenticate,
  authorize("USER"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      await tripContentService.deleteMedia(req.params.id, userId);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.DELETED,
      });
    } catch (error) {
      handleError(error, res);
    }
  },
);

export default router;
