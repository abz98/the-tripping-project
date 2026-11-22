/**
 * Public Routes - No auth required
 */

import { Router, Request, Response } from "express";
import { publicService } from "../../services/public/public.service.js";
import { paymentService } from "../../services/payments/payments.service.js";
import { PaymentError } from "../../services/payments/payments.errors.js";
import { HTTP_STATUS } from "../../constants/statusCodes.js";
import { MESSAGES } from "../../constants/messages.js";

const router = Router();

// Get Active Banners
router.get("/public/banners", async (_req: Request, res: Response) => {
  try {
    const banners = await publicService.getActiveBanners();
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: banners,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: MESSAGES.ERROR.INTERNAL_SERVER,
      error: { code: "INTERNAL_ERROR" },
    });
  }
});

// Get Categories
router.get("/public/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await publicService.getCategories();
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: categories,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: MESSAGES.ERROR.INTERNAL_SERVER,
      error: { code: "INTERNAL_ERROR" },
    });
  }
});

// Get Featured Trips
router.get("/public/trips/featured", async (_req: Request, res: Response) => {
  try {
    const trips = await publicService.getFeaturedTrips();
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: trips,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: MESSAGES.ERROR.INTERNAL_SERVER,
      error: { code: "INTERNAL_ERROR" },
    });
  }
});

// Get Payment Details (Public - for payment gateway)
router.get("/public/payments/:paymentId", async (req: Request, res: Response) => {
  try {
    const paymentDetails = await paymentService.getPublicPaymentDetails(req.params.paymentId);
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: paymentDetails,
    });
  } catch (error) {
    if (error instanceof PaymentError) {
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
});

// Get Payment Details by Booking ID (Public - creates payment if not exists)
router.get("/public/bookings/:bookingId/payment", async (req: Request, res: Response) => {
  try {
    const paymentDetails = await paymentService.getPublicPaymentDetailsByBooking(
      req.params.bookingId,
    );
    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: MESSAGES.SUCCESS.FETCHED,
      data: paymentDetails,
    });
  } catch (error) {
    if (error instanceof PaymentError) {
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
});

export default router;

// Verify Payment by Order ID (Public - finds payment by order ID)
router.post("/public/payments/verify", async (req: Request, res: Response) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        status: "error",
        message: "Missing required payment verification fields",
        error: { code: "VALIDATION_ERROR" },
      });
      return;
    }

    const payment = await paymentService.verifyAndCompletePaymentByOrderId(
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    );

    res.status(HTTP_STATUS.OK).json({
      status: "success",
      message: "Payment verified successfully",
      data: payment,
    });
  } catch (error) {
    if (error instanceof PaymentError) {
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
});
