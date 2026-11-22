/**
 * Host Trip Routes
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/rbac.middleware.js";
import { tripService } from "../../../services/trips/trips.service.js";
import { storageService } from "../../../services/storage/storage.service.js";
import {
  TripError,
  TripValidationError,
  TripNotFoundError,
  TripForbiddenError,
} from "../../../services/trips/trips.errors.js";
import { HTTP_STATUS } from "../../../constants/statusCodes.js";
import { MESSAGES } from "../../../constants/messages.js";

const router = Router();

// Configure multer for form-data with file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 10MB per file
  },
});

interface AuthenticatedRequest extends Request {
  user: { userId: string; role: string };
}

function handleTripError(error: unknown, res: Response): void {
  if (error instanceof TripValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: "error",
      message: error.message,
      error: { code: error.code, details: error.details },
    });
    return;
  }

  if (error instanceof TripNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof TripForbiddenError) {
    res.status(HTTP_STATUS.FORBIDDEN).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof TripError) {
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

// Create Trip
router.post(
  "/host/trips",
  authenticate,
  authorize("USER"),
  upload.any(),
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;

      // Handle uploaded image files
      const files = req.files as Express.Multer.File[];
      const imageUrls: string[] = [];

      if (files && files.length > 0) {
        // Upload all images to MinIO
        for (const file of files) {
          if (file.fieldname === "images") {
            try {
              const uploadResult = await storageService.uploadFile(
                file.buffer,
                file.originalname,
                file.mimetype,
                "trips",
              );
              imageUrls.push(uploadResult.fileUrl);
            } catch (uploadError) {
              console.error("Image upload error:", uploadError);
              // Continue with other images even if one fails
            }
          }
        }
      }

      // If no files uploaded, check for images in body (URLs)
      if (imageUrls.length === 0 && req.body.images) {
        try {
          const parsedImages = JSON.parse(req.body.images);
          imageUrls.push(...parsedImages);
        } catch (parseError) {
          console.error("Failed to parse images from body:", parseError);
        }
      }

      // Parse form-data fields with error handling
      const tripData = {
        title: req.body.title,
        categoryId: req.body.categoryId ? JSON.parse(req.body.categoryId) : [],
        destination: req.body.destination ? JSON.parse(req.body.destination) : [],
        pricePerPerson: req.body.pricePerPerson ? Number(req.body.pricePerPerson) : 0,
        route: req.body.route ? JSON.parse(req.body.route) : {},
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        batches: req.body.batches ? JSON.parse(req.body.batches) : [],
        images: imageUrls,
        aboutTrip: req.body.aboutTrip,
        cancellationPolicy: req.body.cancellationPolicy
          ? JSON.parse(req.body.cancellationPolicy)
          : {},
        additionalMessage: req.body.additionalMessage,
        tripRequestDescription: req.body.tripRequestDescription,
        status: req.body.status,
      };

      const trip = await tripService.create(userId, tripData);
      res.status(HTTP_STATUS.CREATED).json({
        status: "success",
        message: MESSAGES.SUCCESS.CREATED,
        data: trip,
      });
    } catch (error) {
      console.error("Trip creation error:", error);
      handleTripError(error, res);
    }
  },
);

// Get My Trips
router.get("/host/trips", authenticate, authorize("USER"), async (req: Request, res: Response) => {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const trips = await tripService.getMyTrips(userId);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: trips,
    });
  } catch (error) {
    handleTripError(error, res);
  }
});

// Get All Trips
router.get("/public/trips", async (req: Request, res: Response) => {
  try {
    const { destination, travellers, startDate } = req.query;

    // Parse query parameters
    const filters: {
      destination?: string;
      travellers?: number;
      startDate?: string;
    } = {};

    if (destination && typeof destination === "string") {
      filters.destination = destination;
    }

    if (travellers) {
      const travellersNum = parseInt(travellers as string, 10);
      if (!isNaN(travellersNum) && travellersNum > 0) {
        filters.travellers = travellersNum;
      }
    }

    if (startDate && typeof startDate === "string") {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (dateRegex.test(startDate)) {
        filters.startDate = startDate;
      }
    }

    // Use search method if any filters are provided, otherwise get all
    const trips =
      Object.keys(filters).length > 0
        ? await tripService.searchTrips(filters)
        : await tripService.getMyTrips();

    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: trips,
    });
  } catch (error) {
    handleTripError(error, res);
  }
});

// Get Trips by Category
router.get("/public/trips/category/:categoryId", async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.params;
    const trips = await tripService.getTripsByCategory(categoryId);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: trips,
    });
  } catch (error) {
    handleTripError(error, res);
  }
});

// Get All Trips
router.get("/public/trips/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const trips = await tripService.getTripById(id);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: trips,
    });
  } catch (error) {
    handleTripError(error, res);
  }
});

// Update Trip
router.put(
  "/host/trips/:id",
  authenticate,
  authorize("USER"),
  upload.any(),
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;

      // Handle uploaded image files
      const files = req.files as Express.Multer.File[];
      const imageUrls: string[] = [];

      if (files && files.length > 0) {
        // Upload all images to MinIO
        for (const file of files) {
          if (file.fieldname === "images") {
            try {
              const uploadResult = await storageService.uploadFile(
                file.buffer,
                file.originalname,
                file.mimetype,
                "trips",
              );
              imageUrls.push(uploadResult.fileUrl);
            } catch (uploadError) {
              console.error("Image upload error:", uploadError);
              // Continue with other images even if one fails
            }
          }
        }
      }

      // Parse existing images from body if provided
      let existingImages: string[] = [];
      if (req.body.existingImages) {
        try {
          existingImages = JSON.parse(req.body.existingImages);
        } catch (parseError) {
          console.error("Failed to parse existing images:", parseError);
        }
      }

      // If no files uploaded and images field exists, parse it
      if (imageUrls.length === 0 && req.body.images) {
        try {
          const parsedImages = JSON.parse(req.body.images);
          imageUrls.push(...parsedImages);
        } catch (parseError) {
          console.error("Failed to parse images from body:", parseError);
        }
      }

      // Combine existing images with new uploads
      const allImages = [...existingImages, ...imageUrls];

      // Parse form-data fields with error handling
      const updateData: any = {};

      if (req.body.title) updateData.title = req.body.title;
      if (req.body.categoryId) updateData.categoryId = JSON.parse(req.body.categoryId);
      if (req.body.destination) updateData.destination = JSON.parse(req.body.destination);
      if (req.body.pricePerPerson) updateData.pricePerPerson = Number(req.body.pricePerPerson);
      if (req.body.route) updateData.route = JSON.parse(req.body.route);
      if (req.body.tags) updateData.tags = JSON.parse(req.body.tags);
      if (req.body.batches) updateData.batches = JSON.parse(req.body.batches);
      if (allImages.length > 0) updateData.images = allImages;
      if (req.body.aboutTrip) updateData.aboutTrip = req.body.aboutTrip;
      if (req.body.cancellationPolicy)
        updateData.cancellationPolicy = JSON.parse(req.body.cancellationPolicy);
      if (req.body.additionalMessage) updateData.additionalMessage = req.body.additionalMessage;
      if (req.body.tripRequestDescription)
        updateData.tripRequestDescription = req.body.tripRequestDescription;
      if (req.body.status) updateData.status = req.body.status;

      const trip = await tripService.update(req.params.id, userId, updateData);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.UPDATED,
        data: trip,
      });
    } catch (error) {
      console.error("Trip update error:", error);
      handleTripError(error, res);
    }
  },
);

// Submit For Approval
router.post(
  "/host/trips/:id/submit",
  authenticate,
  authorize("USER"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const trip = await tripService.submitForApproval(req.params.id, userId);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.UPDATED,
        data: trip,
      });
    } catch (error) {
      handleTripError(error, res);
    }
  },
);

// Delete Trip (soft delete)
router.delete(
  "/host/trips/:id",
  authenticate,
  authorize("USER"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      await tripService.delete(req.params.id, userId);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.DELETED,
      });
    } catch (error) {
      handleTripError(error, res);
    }
  },
);

// Get Moderation History (rejection reasons and admin feedback)
router.get(
  "/host/trips/:id/moderation",
  authenticate,
  authorize("USER"),
  async (req: Request, res: Response) => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const history = await tripService.getModerationHistory(req.params.id, userId);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.FETCHED,
        data: history,
      });
    } catch (error) {
      handleTripError(error, res);
    }
  },
);

export default router;
