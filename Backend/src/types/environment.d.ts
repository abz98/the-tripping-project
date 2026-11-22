/**
 * Type definitions for environment variables
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Server
      NODE_ENV: "development" | "production" | "test";
      PORT: string;
      HOST: string;

      // Database
      MONGODB_URI: string;
      DB_HOST: string;
      DB_PORT: string;
      DB_NAME: string;
      DB_USER: string;
      DB_PASSWORD: string;

      // JWT
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      JWT_REFRESH_SECRET: string;
      JWT_REFRESH_EXPIRES_IN: string;

      // CORS
      CORS_ORIGIN: string;

      // Rate Limiting
      RATE_LIMIT_WINDOW_MS: string;
      RATE_LIMIT_MAX_REQUESTS: string;

      // Logging
      LOG_LEVEL: string;

      // Email
      SMTP_HOST: string;
      SMTP_PORT: string;
      SMTP_USER: string;
      SMTP_PASSWORD: string;

      // File Upload
      MAX_FILE_SIZE: string;
      UPLOAD_DIR: string;

      // Redis
      REDIS_HOST: string;
      REDIS_PORT: string;
      REDIS_PASSWORD: string;

      // External APIs
      EXTERNAL_API_KEY: string;
      EXTERNAL_API_URL: string;
    }
  }
}

export {};
