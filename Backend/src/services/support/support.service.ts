/**
 * Support Service - Contact & Newsletter
 */

import mongoose from "mongoose";
import { ContactMessage } from "../../models/contactMessage/contactMessage.model.js";
import { Newsletter } from "../../models/newsletter/newsletter.model.js";
import { SupportValidationError } from "./support.errors.js";

export interface ContactDTO {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface ContactResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: Date;
}

export interface NewsletterResponse {
  id: string;
  email: string;
  createdAt: Date;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const supportService = {
  async submitContact(data: ContactDTO): Promise<ContactResponse> {
    const errors: Record<string, string> = {};

    if (!data.name?.trim()) errors.name = "Name is required";
    if (!data.email?.trim()) errors.email = "Email is required";
    else if (!EMAIL_REGEX.test(data.email)) errors.email = "Invalid email format";
    if (!data.phone?.trim()) errors.phone = "Phone is required";
    if (!data.message?.trim()) errors.message = "Message is required";

    if (Object.keys(errors).length > 0) {
      throw new SupportValidationError("Validation failed", errors);
    }

    const contact = await ContactMessage.create({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      message: data.message.trim(),
    });

    return {
      id: (contact._id as mongoose.Types.ObjectId).toString(),
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      message: contact.message,
      createdAt: contact.createdAt,
    };
  },

  async subscribeNewsletter(email: string): Promise<NewsletterResponse> {
    if (!email?.trim()) {
      throw new SupportValidationError("Email is required");
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new SupportValidationError("Invalid email format");
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email: normalizedEmail });
    if (existing) {
      return {
        id: (existing._id as mongoose.Types.ObjectId).toString(),
        email: existing.email,
        createdAt: existing.createdAt,
      };
    }

    const subscription = await Newsletter.create({
      email: normalizedEmail,
    });

    return {
      id: (subscription._id as mongoose.Types.ObjectId).toString(),
      email: subscription.email,
      createdAt: subscription.createdAt,
    };
  },
};

export default supportService;
