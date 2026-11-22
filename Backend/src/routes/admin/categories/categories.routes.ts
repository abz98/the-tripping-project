/**
 * Category Admin Routes
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import { authenticate } from "../../../middlewares/auth.middleware.js";
import { authorize } from "../../../middlewares/rbac.middleware.js";
import { categoryService } from "../../../services/categories/categories.service.js";
import {
  CategoryError,
  CategoryValidationError,
  CategoryNotFoundError,
} from "../../../services/categories/categories.errors.js";
import { storageService } from "../../../services/storage/storage.service.js";
import { HTTP_STATUS } from "../../../constants/statusCodes.js";
import { MESSAGES } from "../../../constants/messages.js";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."));
    }
  },
});

function handleCategoryError(error: unknown, res: Response): void {
  if (error instanceof CategoryValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: "error",
      message: error.message,
      error: { code: error.code, details: error.details },
    });
    return;
  }

  if (error instanceof CategoryNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      status: "error",
      message: error.message,
      error: { code: error.code },
    });
    return;
  }

  if (error instanceof CategoryError) {
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

// Create Category
router.post(
  "/admin/categories",
  authenticate,
  authorize("ADMIN"),
  upload.any(),
  async (req: Request, res: Response) => {
    try {
      // Validate required fields
      const errors: Record<string, string> = {};

      if (!req.body.name?.trim()) {
        errors.name = "Name is required";
      }

      if (!req.body.type?.trim()) {
        errors.type = "Type is required (EXPERIENCE, DESTINATION, or SEASON)";
      }

      // Check if either image file or icon_url is provided
      const files = req.files as Express.Multer.File[];
      const hasImageFile = files && files.length > 0;
      const hasIconUrl = req.body.icon_url?.trim();

      if (!hasImageFile && !hasIconUrl) {
        errors.icon_url = "Icon is required (upload image file or provide icon_url)";
      }

      if (Object.keys(errors).length > 0) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: "error",
          message: "Validation failed",
          error: {
            code: "VALIDATION_ERROR",
            details: errors,
          },
        });
        return;
      }

      let iconUrl = req.body.icon_url;

      // If image file is uploaded, save to MinIO
      if (hasImageFile) {
        const imageFile = files[0];
        const uploadResult = await storageService.uploadFile(
          imageFile.buffer,
          imageFile.originalname,
          imageFile.mimetype,
          "categories",
        );
        iconUrl = uploadResult.fileUrl;
      }

      // Create category with uploaded image URL
      const categoryData = {
        ...req.body,
        icon_url: iconUrl,
      };

      const category = await categoryService.create(categoryData);
      res.status(HTTP_STATUS.CREATED).json({
        status: "success",
        message: MESSAGES.SUCCESS.CREATED,
        data: category,
      });
    } catch (error) {
      handleCategoryError(error, res);
    }
  },
);

// List Categories
router.get(
  "/admin/categories",
  authenticate,
  authorize("ADMIN"),
  async (_req: Request, res: Response) => {
    try {
      const categories = await categoryService.list();
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.FETCHED,
        data: categories,
      });
    } catch (error) {
      handleCategoryError(error, res);
    }
  },
);

// Update Category
router.put(
  "/admin/categories/:id",
  authenticate,
  authorize("ADMIN"),
  upload.any(),
  async (req: Request, res: Response) => {
    try {
      let iconUrl = req.body.icon_url;

      // If new image file is uploaded, save to MinIO
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        const imageFile = files[0];
        const uploadResult = await storageService.uploadFile(
          imageFile.buffer,
          imageFile.originalname,
          imageFile.mimetype,
          "categories",
        );
        iconUrl = uploadResult.fileUrl;
      }

      // Update category with new image URL if provided
      const categoryData = {
        ...req.body,
        ...(iconUrl && { icon_url: iconUrl }),
      };

      const category = await categoryService.update(req.params.id, categoryData);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.UPDATED,
        data: category,
      });
    } catch (error) {
      handleCategoryError(error, res);
    }
  },
);

// Delete Category
router.delete(
  "/admin/categories/:id",
  authenticate,
  authorize("ADMIN"),
  async (req: Request, res: Response) => {
    try {
      await categoryService.delete(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        status: "success",
        message: MESSAGES.SUCCESS.DELETED,
      });
    } catch (error) {
      handleCategoryError(error, res);
    }
  },
);

export default router;
