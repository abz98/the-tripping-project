/**
 * Razorpay Integration Service
 */

import Razorpay from "razorpay";
import crypto from "crypto";
import { config } from "../../config/env.config.js";

let razorpayInstance: Razorpay | null = null;

/**
 * Get Razorpay instance (singleton)
 */
function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret,
    });
  }
  return razorpayInstance;
}

export interface CreateOrderOptions {
  amount: number; // Amount in smallest currency unit (paise for INR)
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

export const razorpayService = {
  /**
   * Create a Razorpay order
   */
  async createOrder(options: CreateOrderOptions): Promise<RazorpayOrder> {
    try {
      const razorpay = getRazorpayInstance();
      const order = await razorpay.orders.create({
        amount: options.amount,
        currency: options.currency,
        receipt: options.receipt,
        notes: options.notes,
      });
      return order as RazorpayOrder;
    } catch (error) {
      console.error("Razorpay order creation failed:", error);
      throw new Error("Failed to create Razorpay order");
    }
  },

  /**
   * Fetch order details
   */
  async fetchOrder(orderId: string): Promise<RazorpayOrder> {
    try {
      const razorpay = getRazorpayInstance();
      const order = await razorpay.orders.fetch(orderId);
      return order as RazorpayOrder;
    } catch (error) {
      console.error("Failed to fetch Razorpay order:", error);
      throw new Error("Failed to fetch order details");
    }
  },

  /**
   * Verify payment signature
   */
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    try {
      const generatedSignature = crypto
        .createHmac("sha256", config.razorpayKeySecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      return generatedSignature === signature;
    } catch (error) {
      console.error("Signature verification failed:", error);
      return false;
    }
  },
};

export default razorpayService;
