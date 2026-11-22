/**
 * MinIO Configuration
 * Manages MinIO client connection for object storage
 */

import * as Minio from "minio";
import { config } from "./env.config.js";

// Create MinIO client
const minioClient = new Minio.Client({
  endPoint: config.minio.endPoint,
  port: config.minio.port,
  useSSL: config.minio.useSSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

// Initialize bucket
const initializeBucket = async () => {
  try {
    const bucketExists = await minioClient.bucketExists(config.minio.bucketName);

    if (!bucketExists) {
      await minioClient.makeBucket(config.minio.bucketName, "us-east-1");
      console.log(`✅ MinIO bucket '${config.minio.bucketName}' created successfully`);

      // Set bucket policy to public read (optional - for public access to images)
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${config.minio.bucketName}/*`],
          },
        ],
      };

      await minioClient.setBucketPolicy(config.minio.bucketName, JSON.stringify(policy));
      console.log(`✅ MinIO bucket policy set to public read`);
    } else {
      console.log(`✅ MinIO bucket '${config.minio.bucketName}' already exists`);
    }
  } catch (error) {
    console.error("❌ Failed to initialize MinIO bucket:", error);
  }
};

// Initialize bucket on startup
initializeBucket();

export { minioClient };
export default minioClient;
