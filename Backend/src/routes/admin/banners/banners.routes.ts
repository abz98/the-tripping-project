/**
 * Banner Admin Routes
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/rbac.middleware.js";
import { bannerService } from "../../../services/banners/banners.service.js";
import { storageService } from "../../../services/storage/storage.service.js";
import {
  BannerError,
  BannerValidationError,
  BannerNotFoundError,
} from "../../../services/banners/banners.errors.js";
import { HTTP_STATUS } from "../../../constants/statusCodes.js";
import { MESSAGES } from "../../../constants/messages.js";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for banners
  },
  fileFilter: (req, file, cb) => {
    // Allow only images
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  },
});

// Use .any() to accept any field name for flexibility
const uploadAny = upload.any();

function handleBannerError(error: unknown, res: Response): void {
  if (error instanceof BannerValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: "error",
      message: error.message,
      error: { code: error.code, details: error.details },
    });
    return;
  }

  if (error instanceof BannerNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof BannerError) {
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

// Create Banner - POST /admin/banners
router.post(
  "/admin/banners",
  authenticate,
  authorize("ADMIN"),
  uploadAny,
  async (req: Request, res: Response) => {
    try {
      let imageUrl = req.body.image_url;

      // Check for uploaded file (any field name)
      const files = req.files as Express.Multer.File[];
      const imageFile = files && files.length > 0 ? files[0] : null;

      // If image file is uploaded, save to MinIO
      if (imageFile) {
        const uploadResult = await storageService.uploadFile(
          imageFile.buffer,
          imageFile.originalname,
          imageFile.mimetype,
          "banners",
        );
        imageUrl = uploadResult.fileUrl;
      }

      // Create banner with uploaded image URL
      const bannerData = {
        ...req.body,
        image_url: imageUrl,
      };

      const banner = await bannerService.create(bannerData);
      res.status(HTTP_STATUS.CREATED).json({
        status: "success",
        message: MESSAGES.SUCCESS.CREATED,
        data: banner,
      });
    } catch (error) {
      handleBannerError(error, res);
    }
  },
);

// List Banners - GET /admin/banners
router.get(
  "/admin/banners",
  authenticate,
  authorize("ADMIN"),
  async (_req: Request, res: Response) => {
    try {
      const banners = await bannerService.list();
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.FETCHED,
        data: banners,
      });
    } catch (error) {
      handleBannerError(error, res);
    }
  },
);

// Update Banner - PUT /admin/banners/:id
router.put(
  "/admin/banners/:id",
  authenticate,
  authorize("ADMIN"),
  uploadAny,
  async (req: Request, res: Response) => {
    try {
      let imageUrl = req.body.image_url;

      // Check for uploaded file (any field name)
      const files = req.files as Express.Multer.File[];
      const imageFile = files && files.length > 0 ? files[0] : null;

      // If new image file is uploaded, save to MinIO
      if (imageFile) {
        const uploadResult = await storageService.uploadFile(
          imageFile.buffer,
          imageFile.originalname,
          imageFile.mimetype,
          "banners",
        );
        imageUrl = uploadResult.fileUrl;
      }

      // Update banner with new image URL if provided
      const bannerData = {
        ...req.body,
        ...(imageUrl && { image_url: imageUrl }),
      };

      const banner = await bannerService.update(req.params.id, bannerData);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.UPDATED,
        data: banner,
      });
    } catch (error) {
      handleBannerError(error, res);
    }
  },
);

// Delete Banner - DELETE /admin/banners/:id
router.delete(
  "/admin/banners/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      await bannerService.delete(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.DELETED,
      });
    } catch (error) {
      handleBannerError(error, res);
    }
  },
);

// Toggle Banner Status - PATCH /admin/banners/:id/status
router.patch(
  "/admin/banners/:id/status",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const banner = await bannerService.toggleStatus(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.UPDATED,
        data: banner,
      });
    } catch (error) {
      handleBannerError(error, res);
    }
  },
);

export default router;
