/**
 * Support & Newsletter Routes
 */

import { Router, Request, Response } from "express";
import { supportService } from "../../services/support/support.service.js";
import { SupportValidationError } from "../../services/support/support.errors.js";
import { HTTP_STATUS } from "../../constants/statusCodes.js";
import { MESSAGES } from "../../constants/messages.js";

const router = Router();

function handleError(error: unknown, res: Response): void {
  if (error instanceof SupportValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: "error",
      message: error.message,
      error: { code: error.code, details: error.details },
    });
    return;
  }

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    status: "error",
    message: MESSAGES.ERROR.INTERNAL_SERVER,
    error: { code: "INTERNAL_ERROR" },
  });
}

// Contact Us
router.post("/support/contact", async (req: Request, res: Response) => {
  try {
    const message = await supportService.submitContact(req.body);
    res.status(HTTP_STATUS.CREATED).json({
      status: "success",
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Subscribe Newsletter
router.post("/newsletter/subscribe", async (req: Request, res: Response) => {
  try {
    const subscription = await supportService.subscribeNewsletter(req.body.email);
    res.status(HTTP_STATUS.CREATED).json({
      status: "success",
      message: "Subscribed successfully",
      data: subscription,
    });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;
