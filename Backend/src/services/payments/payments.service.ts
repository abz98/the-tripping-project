/**
 * Payment Service
 */

import mongoose from "mongoose";
import { Payment } from "../../models/payments/payment.model.js";
import { Booking } from "../../models/bookings/booking.model.js";
import {
  PaymentValidationError,
  PaymentNotFoundError,
  PaymentForbiddenError,
} from "./payments.errors.js";

export interface InitiatePaymentDTO {
  booking_id: string;
  gateway?: string;
}

export interface WebhookPayload {
  gateway_payment_id: string;
  gateway_order_id: string;
  status: "SUCCESS" | "FAILED";
  metadata?: Record<string, unknown>;
}

export interface PaymentResponse {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  currency: string;
  gateway: string;
  gateway_payment_id?: string;
  gateway_order_id?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicPaymentDetailsResponse {
  paymentId: string;
  bookingId: string;
  tripTitle: string;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  razorpayOrderId: string;
  razorpayKeyId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
}

export interface InitiatePaymentResponse extends PaymentResponse {
  checkout_url?: string;
}

function toPaymentResponse(payment: any): PaymentResponse {
  return {
    id: (payment._id as mongoose.Types.ObjectId).toString(),
    booking_id: payment.booking_id.toString(),
    user_id: payment.user_id.toString(),
    amount: payment.amount,
    currency: payment.currency,
    gateway: payment.gateway,
    gateway_payment_id: payment.gateway_payment_id,
    gateway_order_id: payment.gateway_order_id,
    status: payment.status,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

export const paymentService = {
  async initiate(userId: string, data: InitiatePaymentDTO): Promise<InitiatePaymentResponse> {
    if (!data.booking_id) {
      throw new PaymentValidationError("Booking ID is required");
    }

    if (!mongoose.Types.ObjectId.isValid(data.booking_id)) {
      throw new PaymentValidationError("Invalid booking ID");
    }

    const booking = await Booking.findById(data.booking_id);
    if (!booking) {
      throw new PaymentValidationError("Booking not found");
    }

    if (booking.user_id.toString() !== userId) {
      throw new PaymentForbiddenError();
    }

    if (booking.status === "CANCELLED") {
      throw new PaymentValidationError("Cannot pay for a cancelled booking");
    }

    if (booking.payment_status === "PAID") {
      throw new PaymentValidationError("Booking is already paid");
    }

    // Check for existing pending payment
    const existingPayment = await Payment.findOne({
      booking_id: data.booking_id,
      status: { $in: ["INITIATED", "PENDING"] },
    });

    if (existingPayment) {
      return {
        ...toPaymentResponse(existingPayment),
        checkout_url: `https://payment-gateway.example.com/pay/${existingPayment.gateway_order_id}`,
      };
    }

    const gateway = data.gateway || "razorpay";
    const gatewayOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const payment = await Payment.create({
      booking_id: new mongoose.Types.ObjectId(data.booking_id),
      user_id: new mongoose.Types.ObjectId(userId),
      amount: booking.total_amount,
      currency: "INR",
      gateway,
      gateway_order_id: gatewayOrderId,
      status: "INITIATED",
    });

    return {
      ...toPaymentResponse(payment),
      checkout_url: `https://payment-gateway.example.com/pay/${gatewayOrderId}`,
    };
  },

  async handleWebhook(payload: WebhookPayload): Promise<PaymentResponse> {
    if (!payload.gateway_order_id) {
      throw new PaymentValidationError("Gateway order ID is required");
    }

    const payment = await Payment.findOne({ gateway_order_id: payload.gateway_order_id });
    if (!payment) {
      throw new PaymentNotFoundError("Payment not found for this order");
    }

    if (payment.status === "SUCCESS" || payment.status === "REFUNDED") {
      return toPaymentResponse(payment);
    }

    payment.gateway_payment_id = payload.gateway_payment_id;
    payment.status = payload.status === "SUCCESS" ? "SUCCESS" : "FAILED";
    payment.metadata = payload.metadata;
    await payment.save();

    // Update booking status if payment successful
    if (payload.status === "SUCCESS") {
      await Booking.findByIdAndUpdate(payment.booking_id, {
        status: "CONFIRMED",
        payment_status: "PAID",
      });
    }

    return toPaymentResponse(payment);
  },

  async getById(paymentId: string, userId: string): Promise<PaymentResponse> {
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      throw new PaymentNotFoundError();
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new PaymentNotFoundError();
    }

    if (payment.user_id.toString() !== userId) {
      throw new PaymentForbiddenError();
    }

    return toPaymentResponse(payment);
  },

  async getOrCreatePaymentForBooking(bookingId: string): Promise<InitiatePaymentResponse> {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new PaymentValidationError("Invalid booking ID");
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new PaymentValidationError("Booking not found");
    }

    if (booking.status === "CANCELLED") {
      throw new PaymentValidationError("Cannot pay for a cancelled booking");
    }

    if (booking.payment_status === "PAID") {
      throw new PaymentValidationError("Booking is already paid");
    }

    // Check for existing payment
    const existingPayment = await Payment.findOne({
      booking_id: bookingId,
      status: { $in: ["INITIATED", "PENDING"] },
    });

    if (existingPayment) {
      return {
        ...toPaymentResponse(existingPayment),
        checkout_url: `https://payment-gateway.example.com/pay/${existingPayment.gateway_order_id}`,
      };
    }

    // Create Razorpay order
    const gateway = "razorpay";
    let gatewayOrderId: string;

    try {
      const { razorpayService } = await import("./razorpay.service.js");
      const razorpayOrder = await razorpayService.createOrder({
        amount: booking.total_amount * 100, // Convert to paise
        currency: "INR",
        receipt: `booking_${bookingId}`,
        notes: {
          booking_id: bookingId,
          user_id: booking.user_id.toString(),
        },
      });
      gatewayOrderId = razorpayOrder.id;
    } catch (error) {
      console.error("Failed to create Razorpay order, using fallback:", error);
      // Fallback to mock order ID if Razorpay fails
      gatewayOrderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Create payment record
    const payment = await Payment.create({
      booking_id: new mongoose.Types.ObjectId(bookingId),
      user_id: booking.user_id,
      amount: booking.total_amount,
      currency: "INR",
      gateway,
      gateway_order_id: gatewayOrderId,
      status: "INITIATED",
    });

    return {
      ...toPaymentResponse(payment),
      checkout_url: `https://payment-gateway.example.com/pay/${gatewayOrderId}`,
    };
  },

  async getPublicPaymentDetails(paymentId: string): Promise<PublicPaymentDetailsResponse> {
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      throw new PaymentNotFoundError();
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new PaymentNotFoundError();
    }

    // Get booking details
    const booking = await Booking.findById(payment.booking_id);
    if (!booking) {
      throw new PaymentValidationError("Booking not found");
    }

    // Get trip details
    const { Trip } = await import("../../models/trips/trips.model.js");
    const trip = await Trip.findById(booking.trip_id);
    if (!trip) {
      throw new PaymentValidationError("Trip not found");
    }

    // Get user details
    const { User } = await import("../../models/users/users.model.js");
    const user = await User.findById(payment.user_id);
    if (!user) {
      throw new PaymentValidationError("User not found");
    }

    // Map payment status to public format
    let publicStatus: "PENDING" | "COMPLETED" | "FAILED";
    if (payment.status === "SUCCESS") {
      publicStatus = "COMPLETED";
    } else if (payment.status === "FAILED") {
      publicStatus = "FAILED";
    } else {
      publicStatus = "PENDING";
    }

    // Get Razorpay key from environment
    const { config } = await import("../../config/env.config.js");
    const razorpayKeyId = config.razorpayKeyId || "rzp_test_key";

    return {
      paymentId: payment._id.toString(),
      bookingId: booking._id.toString(),
      tripTitle: trip.title,
      amount: payment.amount,
      currency: payment.currency,
      status: publicStatus,
      razorpayOrderId: payment.gateway_order_id || "",
      razorpayKeyId,
      customerName: user.full_name,
      customerEmail: user.email,
      customerPhone: user.phone || "",
      description: `Payment for ${trip.title} - ${booking.num_travelers} traveler(s)`,
    };
  },

  async getPublicPaymentDetailsByBooking(bookingId: string): Promise<PublicPaymentDetailsResponse> {
    // First get or create payment for this booking
    const paymentResponse = await this.getOrCreatePaymentForBooking(bookingId);

    // Then get the full payment details
    return this.getPublicPaymentDetails(paymentResponse.id);
  },

  async verifyAndCompletePaymentByOrderId(
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string,
  ): Promise<PaymentResponse> {
    // Find payment by order ID
    const payment = await Payment.findOne({ gateway_order_id: razorpayOrderId });
    if (!payment) {
      throw new PaymentNotFoundError("Payment not found for this order");
    }

    // Verify the payment signature
    let isSignatureValid = false;
    try {
      const { razorpayService } = await import("./razorpay.service.js");
      isSignatureValid = razorpayService.verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      );
    } catch (error) {
      console.error("Signature verification failed:", error);
      throw new PaymentValidationError("Payment verification failed");
    }

    if (!isSignatureValid) {
      // Update payment as failed
      payment.status = "FAILED";
      payment.gateway_payment_id = razorpayPaymentId;
      await payment.save();
      throw new PaymentValidationError("Invalid payment signature");
    }

    // Update payment as successful
    payment.status = "SUCCESS";
    payment.gateway_payment_id = razorpayPaymentId;
    await payment.save();

    // Get booking to decrement slots
    const booking = await Booking.findById(payment.booking_id);
    if (!booking) {
      throw new PaymentValidationError("Booking not found");
    }

    // Decrement available slots NOW (after payment confirmation)
    const { TripBatch } = await import("../../models/tripBatch/tripBatch.model.js");
    const batch = await TripBatch.findById(booking.batch_id);
    if (batch) {
      // Check if slots are still available
      if (batch.available_slots < booking.num_travelers) {
        // Payment succeeded but no slots available - this is a race condition
        // Mark payment as success but booking needs manual review
        await Booking.findByIdAndUpdate(payment.booking_id, {
          payment_status: "PAID",
          status: "PENDING_REVIEW", // Needs manual intervention
        });
        console.error(
          `⚠️ Payment succeeded but insufficient slots for booking ${booking._id.toString()}`,
        );
      } else {
        // Decrement slots and update booking
        batch.available_slots -= booking.num_travelers;
        await batch.save();

        await Booking.findByIdAndUpdate(payment.booking_id, {
          payment_status: "PAID",
        });
      }
    } else {
      // Batch not found - update booking anyway
      await Booking.findByIdAndUpdate(payment.booking_id, {
        payment_status: "PAID",
      });
    }

    // Send booking confirmation email and add user to chat (fire-and-forget)
    (async () => {
      try {
        const booking = await Booking.findById(payment.booking_id);
        if (!booking) return;

        const { Trip } = await import("../../models/trips/trips.model.js");
        const { TripBatch } = await import("../../models/tripBatch/tripBatch.model.js");
        const { User } = await import("../../models/users/users.model.js");
        const { emailService } = await import("../email/email.service.js");
        const { paymentChatIntegrationService } =
          await import("../chat/payment-integration.service.js");

        const [trip, batch, user, host] = await Promise.all([
          Trip.findById(booking.trip_id),
          TripBatch.findById(booking.batch_id),
          User.findById(booking.user_id),
          Trip.findById(booking.trip_id).then((t) => (t ? User.findById(t.host_id) : null)),
        ]);

        if (user && user.email && trip && batch && host) {
          const batchStartDate = new Date(batch.start_date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          const batchEndDate = new Date(batch.end_date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          // Send confirmation email
          await emailService.sendBookingConfirmedToUser({
            userEmail: user.email,
            userName: user.full_name,
            tripTitle: trip.title,
            numTravelers: booking.num_travelers,
            batchStartDate,
            batchEndDate,
            pickupLocation: booking.pickup_location || "Not specified",
            totalAmount: booking.total_amount,
            bookingId: booking._id.toString(),
            hostName: host.full_name,
            hostEmail: host.email,
            hostPhone: host.phone || "Not provided",
          });

          // Add user to trip chat group
          await paymentChatIntegrationService.onPaymentSuccess(
            trip._id.toString(),
            booking.user_id.toString(),
            user.full_name,
            trip.host_id.toString(),
          );
        }
      } catch (error) {
        console.error("Failed to send booking confirmation email or add to chat:", error);
      }
    })();

    return toPaymentResponse(payment);
  },
};

export default paymentService;
