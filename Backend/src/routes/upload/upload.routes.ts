/**
 * Upload Routes
 * Handles file upload endpoints
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { storageService } from "../../services/storage/storage.service.js";
import { HTTP_STATUS } from "../../constants/statusCodes.js";
import { MESSAGES } from "../../constants/messages.js";
import multer from "multer";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images and videos are allowed."));
    }
  },
});

// Upload single file - POST /upload
router.post("/upload", authenticate, upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    const folder = (req.body.folder as string) || "uploads";

    const result = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder,
    );

    res.status(HTTP_STATUS.CREATED).json({
      status: "success",
      message: "File uploaded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "File upload failed",
      error: { code: "UPLOAD_ERROR" },
    });
  }
});

// Upload multiple files - POST /upload/multiple
router.post(
  "/upload/multiple",
  authenticate,
  upload.array("files", 10), // Max 10 files
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          status: "error",
          message: "No files uploaded",
        });
      }

      const folder = (req.body.folder as string) || "uploads";

      const uploadPromises = files.map((file) =>
        storageService.uploadFile(file.buffer, file.originalname, file.mimetype, folder),
      );

      const results = await Promise.all(uploadPromises);

      res.status(HTTP_STATUS.CREATED).json({
        status: "success",
        message: `${results.length} files uploaded successfully`,
        data: results,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "File upload failed",
        error: { code: "UPLOAD_ERROR" },
      });
    }
  },
);

// Delete file - DELETE /upload/:fileName
router.delete("/upload/:fileName(*)", authenticate, async (req: Request, res: Response) => {
  try {
    const fileName = req.params.fileName;

    await storageService.deleteFile(fileName);

    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "File deletion failed",
      error: { code: "DELETE_ERROR" },
    });
  }
});

// List files - GET /upload/list
router.get("/upload/list", authenticate, async (req: Request, res: Response) => {
  try {
    const prefix = (req.query.prefix as string) || "";

    const files = await storageService.listFiles(prefix);

    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: "Files retrieved successfully",
      data: {
        files,
        count: files.length,
      },
    });
  } catch (error) {
    console.error("List error:", error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "Failed to list files",
      error: { code: "LIST_ERROR" },
    });
  }
});

export default router;
