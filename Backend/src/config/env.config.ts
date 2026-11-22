/* eslint-disable */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

interface EnvConfig {
  // Server
  nodeEnv: string;
  port: number;
  host: string;

  // Database
  database: {
    uri: string;
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };

  // JWT
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };

  // API
  api: {
    version: string;
    prefix: string;
  };

  // CORS
  cors: {
    origin: string;
  };

  // Rate Limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };

  // Logging
  logLevel: string;

  // Email
  email: {
    host: string;
    port: number;
    user: string;
    password: string;
  };

  // File Upload
  upload: {
    maxFileSize: number;
    uploadDir: string;
  };

  // Redis
  redis: {
    host: string;
    port: number;
    password: string;
  };

  // External APIs
  externalApi: {
    key: string;
    url: string;
  };
  googleEmail: string;
  googlePassword: string;

  // MinIO
  minio: {
    endPoint: string;
    port: number;
    useSSL: boolean;
    accessKey: string;
    secretKey: string;
    bucketName: string;
  };

  // Admin Panel
  adminPanelUrl: string;

  // Razorpay
  razorpayKeyId: string;
  razorpayKeySecret: string;
}

const getEnvVariable = (key: string, defaultValue?: string, required: boolean = true): string => {
  const value = process.env[key] || defaultValue;
  if (!value && required) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value || "";
};

export const config: EnvConfig = {
  nodeEnv: getEnvVariable("NODE_ENV", "development"),
  port: parseInt(getEnvVariable("PORT", "3000"), 10),
  host: getEnvVariable("HOST", "localhost"),

  database: {
    uri: getEnvVariable("MONGODB_URI"),
    host: getEnvVariable("DB_HOST", "localhost"),
    port: parseInt(getEnvVariable("DB_PORT", "27017"), 10),
    name: getEnvVariable("DB_NAME"),
    user: getEnvVariable("DB_USER"),
    password: getEnvVariable("DB_PASSWORD"),
  },

  jwt: {
    secret: getEnvVariable("JWT_SECRET"),
    expiresIn: getEnvVariable("JWT_EXPIRES_IN", "7d"),
    refreshSecret: getEnvVariable("JWT_REFRESH_SECRET"),
    refreshExpiresIn: getEnvVariable("JWT_REFRESH_EXPIRES_IN", "30d"),
  },

  api: {
    version: getEnvVariable("API_VERSION", "v1"),
    prefix: getEnvVariable("API_PREFIX", "/api"),
  },

  cors: {
    origin: getEnvVariable("CORS_ORIGIN", "http://localhost:4200"),
  },

  rateLimit: {
    windowMs: parseInt(getEnvVariable("RATE_LIMIT_WINDOW_MS", "900000"), 10),
    maxRequests: parseInt(getEnvVariable("RATE_LIMIT_MAX_REQUESTS", "100"), 10),
  },

  logLevel: getEnvVariable("LOG_LEVEL", "info"),

  email: {
    host: getEnvVariable("SMTP_HOST", "smtp.gmail.com", false),
    port: parseInt(getEnvVariable("SMTP_PORT", "587", false), 10),
    user: getEnvVariable("SMTP_USER", "", false),
    password: getEnvVariable("SMTP_PASSWORD", "", false),
  },

  upload: {
    maxFileSize: parseInt(getEnvVariable("MAX_FILE_SIZE", "5242880"), 10),
    uploadDir: getEnvVariable("UPLOAD_DIR", "uploads"),
  },

  redis: {
    host: getEnvVariable("REDIS_HOST", "localhost", false),
    port: parseInt(getEnvVariable("REDIS_PORT", "6379", false), 10),
    password: getEnvVariable("REDIS_PASSWORD", "", false),
  },

  externalApi: {
    key: getEnvVariable("EXTERNAL_API_KEY", "", false),
    url: getEnvVariable("EXTERNAL_API_URL", "https://api.example.com", false),
  },
  googleEmail: getEnvVariable("EMAIL_NAME"),
  googlePassword: getEnvVariable("EMAIL_TOKEN"),

  minio: {
    endPoint: getEnvVariable("MINIO_ENDPOINT", "localhost", false),
    port: parseInt(getEnvVariable("MINIO_PORT", "9000", false), 10),
    useSSL: getEnvVariable("MINIO_USE_SSL", "false", false) === "true",
    accessKey: getEnvVariable("MINIO_ACCESS_KEY", "minioadmin", false),
    secretKey: getEnvVariable("MINIO_SECRET_KEY", "minioadmin", false),
    bucketName: getEnvVariable("MINIO_BUCKET_NAME", "tripping-uploads", false),
  },

  adminPanelUrl: getEnvVariable("ADMIN_PANEL_URL", "http://localhost:4200/admin", false),

  razorpayKeyId: getEnvVariable("RAZORPAY_KEY_ID"),
  razorpayKeySecret: getEnvVariable("RAZORPAY_KEY_SECRET"),
};

export default config;
