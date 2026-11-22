/**
 * OTP Service
 * Handles OTP generation, storage, and verification using Redis
 */

import redisClient, { isRedisConnected } from "../../config/redis.config.js";

const OTP_EXPIRY_SECONDS = 600; // 10 minutes
const DEFAULT_OTP = "0000"; // Default OTP for development / bypass

export interface IOtpService {
  generateOTP(email: string): Promise<string>;
  verifyOTP(email: string, otp: string): Promise<boolean>;
  deleteOTP(email: string): Promise<void>;
}

export const otpService: IOtpService = {
  /**
   * Generate a 4-digit OTP and store it in Redis
   * @param email - User's email address
   * @returns The generated OTP
   */
  async generateOTP(email: string): Promise<string> {
    // Default to 0000 for development
    const otp = "0000";

    // Store OTP in Redis with 10-minute expiry (if Redis is connected)
    if (isRedisConnected()) {
      try {
        const key = `otp:${email.toLowerCase()}`;
        await redisClient.setEx(key, OTP_EXPIRY_SECONDS, otp);
      } catch (error) {
        console.error("Failed to store OTP in Redis:", error);
      }
    } else {
      console.warn("⚠️  Redis not connected. OTP not stored (using default OTP)");
    }

    return otp;
  },

  /**
   * Verify OTP for a given email
   * @param email - User's email address
   * @param otp - OTP to verify
   * @returns True if OTP is valid, false otherwise
   */
  async verifyOTP(email: string, otp: string): Promise<boolean> {
    // Bypass: accept 0000, DEFAULT_OTP, or legacy 1221 for testing
    if (otp === "0000" || otp === DEFAULT_OTP || otp === "1221") {
      return true;
    }

    if (!isRedisConnected()) {
      // If Redis is not connected, accept default OTP for development
      console.warn("⚠️  Redis not connected. Using default OTP verification");
      return otp === DEFAULT_OTP || otp === "0000" || otp === "1221";
    }

    try {
      const key = `otp:${email.toLowerCase()}`;
      const storedOtp = await redisClient.get(key);

      if (!storedOtp) {
        return false; // OTP expired or doesn't exist
      }

      return storedOtp === otp || otp === DEFAULT_OTP || otp === "0000" || otp === "1221";
    } catch (error) {
      console.error("Failed to verify OTP from Redis:", error);
      // Fallback to default OTP
      return otp === DEFAULT_OTP || otp === "0000" || otp === "1221";
    }
  },

  /**
   * Delete OTP from Redis
   * @param email - User's email address
   */
  async deleteOTP(email: string): Promise<void> {
    if (!isRedisConnected()) {
      return;
    }

    try {
      const key = `otp:${email.toLowerCase()}`;
      await redisClient.del(key);
    } catch (error) {
      console.error("Failed to delete OTP from Redis:", error);
    }
  },
};

export default otpService;
