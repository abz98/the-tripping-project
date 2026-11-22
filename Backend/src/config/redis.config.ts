/**
 * Redis Configuration
 * Manages Redis client connection
 */

import { createClient } from "redis";
import { config } from "./env.config.js";

const redisClient = createClient({
  socket: {
    host: config.redis.host,
    port: config.redis.port,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error("❌ Redis: Max reconnection attempts reached");
        return new Error("Max reconnection attempts reached");
      }
      return Math.min(retries * 100, 3000);
    },
  },
  password: config.redis.password || undefined,
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err.message);
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redisClient.on("ready", () => {
  console.log("✅ Redis is ready to accept commands");
});

redisClient.on("reconnecting", () => {
  console.log("🔄 Redis reconnecting...");
});

// Connect to Redis (non-blocking)
let isConnected = false;

(async () => {
  try {
    await redisClient.connect();
    isConnected = true;
  } catch (error) {
    console.error("⚠️  Failed to connect to Redis. OTP features will be disabled.");
    console.error("   Make sure Redis is running on", `${config.redis.host}:${config.redis.port}`);
  }
})();

// Helper to check if Redis is connected
export const isRedisConnected = () => isConnected;

export default redisClient;
