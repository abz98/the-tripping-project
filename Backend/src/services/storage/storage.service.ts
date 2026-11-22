/**
 * Storage Service
 * Handles file upload, download, and deletion using MinIO
 */

import { minioClient } from "../../config/minio.config.js";
import { config } from "../../config/env.config.js";
import crypto from "crypto";
import path from "path";

export interface UploadResult {
  fileName: string;
  fileUrl: string;
  etag: string;
  size: number;
}

export interface IStorageService {
  uploadFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
    folder?: string,
  ): Promise<UploadResult>;
  getFileUrl(fileName: string): string;
  deleteFile(fileName: string): Promise<void>;
  getFile(fileName: string): Promise<Buffer>;
  listFiles(prefix?: string): Promise<string[]>;
}

export const storageService: IStorageService = {
  /**
   * Upload a file to MinIO
   * @param file - File buffer
   * @param originalName - Original file name
   * @param mimeType - MIME type of the file
   * @param folder - Optional folder path
   * @returns Upload result with file URL
   */
  async uploadFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = "uploads",
  ): Promise<UploadResult> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString("hex");
      const ext = path.extname(originalName);
      const fileName = `${folder}/${timestamp}-${randomString}${ext}`;

      // Upload to MinIO
      const uploadInfo = await minioClient.putObject(
        config.minio.bucketName,
        fileName,
        file,
        file.length,
        {
          "Content-Type": mimeType,
          "x-amz-meta-original-name": originalName,
        },
      );

      // Generate file URL
      const fileUrl = storageService.getFileUrl(fileName);

      return {
        fileName,
        fileUrl,
        etag: uploadInfo.etag,
        size: file.length,
      };
    } catch (error) {
      console.error("Failed to upload file to MinIO:", error);
      throw new Error("File upload failed");
    }
  },

  /**
   * Get public URL for a file
   * @param fileName - File name in MinIO
   * @returns Public URL
   */
  getFileUrl(fileName: string): string {
    const protocol = config.minio.useSSL ? "https" : "http";
    return `${protocol}://${config.minio.endPoint}:${config.minio.port}/${config.minio.bucketName}/${fileName}`;
  },

  /**
   * Delete a file from MinIO
   * @param fileName - File name to delete
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      await minioClient.removeObject(config.minio.bucketName, fileName);
      console.log(`✅ File deleted: ${fileName}`);
    } catch (error) {
      console.error("Failed to delete file from MinIO:", error);
      throw new Error("File deletion failed");
    }
  },

  /**
   * Get file from MinIO
   * @param fileName - File name to retrieve
   * @returns File buffer
   */
  async getFile(fileName: string): Promise<Buffer> {
    try {
      const dataStream = await minioClient.getObject(config.minio.bucketName, fileName);

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        dataStream.on("data", (chunk) => chunks.push(chunk));
        dataStream.on("end", () => resolve(Buffer.concat(chunks)));
        dataStream.on("error", reject);
      });
    } catch (error) {
      console.error("Failed to get file from MinIO:", error);
      throw new Error("File retrieval failed");
    }
  },

  /**
   * List files in MinIO bucket
   * @param prefix - Optional prefix to filter files
   * @returns Array of file names
   */
  async listFiles(prefix: string = ""): Promise<string[]> {
    try {
      const files: string[] = [];
      const stream = minioClient.listObjects(config.minio.bucketName, prefix, true);

      return new Promise((resolve, reject) => {
        stream.on("data", (obj) => {
          if (obj.name) {
            files.push(obj.name);
          }
        });
        stream.on("end", () => resolve(files));
        stream.on("error", reject);
      });
    } catch (error) {
      console.error("Failed to list files from MinIO:", error);
      throw new Error("File listing failed");
    }
  },
};

export default storageService;
