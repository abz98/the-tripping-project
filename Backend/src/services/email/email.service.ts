/**
 * Email Service
 * Handles sending emails using Nodemailer with Gmail
 */

import nodemailer from "nodemailer";
import { config } from "../../config/env.config.js";

export interface IEmailService {
  sendOTPEmail(email: string, otp: string, fullName: string): Promise<void>;
  sendForgotPasswordOTP(email: string, otp: string, fullName: string): Promise<void>;
  sendTripApprovalNotification(
    adminEmail: string,
    adminName: string,
    tripDetails: {
      tripId: string;
      tripTitle: string;
      hostName: string;
      hostEmail: string;
      destination: string[];
      pricePerPerson: number;
    },
  ): Promise<void>;
  sendTripApprovedEmail(
    hostEmail: string,
    hostName: string,
    tripDetails: {
      tripTitle: string;
      reasons: string[];
      adminMessage?: string;
    },
  ): Promise<void>;
  sendTripRejectedEmail(
    hostEmail: string,
    hostName: string,
    tripDetails: {
      tripTitle: string;
      reasons: string[];
      adminMessage?: string;
    },
  ): Promise<void>;
  sendTripChangesRequestedEmail(
    hostEmail: string,
    hostName: string,
    tripDetails: {
      tripTitle: string;
      reasons: string[];
      adminMessage?: string;
    },
  ): Promise<void>;
  sendBookingNotificationToHost(details: {
    hostEmail: string;
    hostName: string;
    userName: string;
    userEmail: string;
    tripTitle: string;
    numTravelers: number;
    batchStartDate: string;
    pickupLocation: string;
    userMessage: string;
    totalAmount: number;
  }): Promise<void>;
  sendBookingRejectionToUser(details: {
    userEmail: string;
    userName: string;
    tripTitle: string;
    reason: string;
  }): Promise<void>;
  sendBookingConfirmationToUser(details: {
    userEmail: string;
    userName: string;
    tripTitle: string;
    numTravelers: number;
    batchStartDate: string;
    pickupLocation: string;
    totalAmount: number;
    bookingId: string;
  }): Promise<void>;
  sendBookingConfirmedToUser(details: {
    userEmail: string;
    userName: string;
    tripTitle: string;
    numTravelers: number;
    batchStartDate: string;
    batchEndDate: string;
    pickupLocation: string;
    totalAmount: number;
    bookingId: string;
    hostName: string;
    hostEmail: string;
    hostPhone: string;
  }): Promise<void>;
}

// Create transporter using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.googleEmail,
    pass: config.googlePassword,
  },
});

export const emailService: IEmailService = {
  /**
   * Send OTP verification email
   * @param email - Recipient email address
   * @param otp - OTP code
   * @param fullName - User's full name
   */
  async sendOTPEmail(email: string, otp: string, fullName: string): Promise<void> {
    const mailOptions = {
      from: `"Tripping Platform" <${config.googleEmail}>`,
      to: email,
      subject: "Verify Your Email - OTP Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #045477;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .otp-box {
              background-color: #f0f0f0;
              border: 2px dashed #67EDE2;
              padding: 20px;
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              margin: 20px 0;
              color: #045477;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Tripping Platform!</h1>
            </div>
            <div class="content">
              <h2>Hello ${fullName},</h2>
              <p>Thank you for registering with Tripping Platform. To complete your registration, please verify your email address using the OTP code below:</p>
              
              <div class="otp-box">
                ${otp}
              </div>
              
              <p><strong>This OTP is valid for 10 minutes.</strong></p>
              
              <p>If you didn't create an account with us, please ignore this email.</p>
              
              <p>Best regards,<br>The Tripping Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hello ${fullName},\n\nThank you for registering with Tripping Platform. Your OTP code is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you didn't create an account with us, please ignore this email.\n\nBest regards,\nThe Tripping Team`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent to ${email}`);
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      throw new Error("Failed to send verification email");
    }
  },

  /**
   * Send forgot password OTP email
   * @param email - Recipient email address
   * @param otp - OTP code
   * @param fullName - User's full name
   */
  async sendForgotPasswordOTP(email: string, otp: string, fullName: string): Promise<void> {
    const mailOptions = {
      from: `"Tripping Platform" <${config.googleEmail}>`,
      to: email,
      subject: "Reset Your Password - OTP Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #045477;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .otp-box {
              background-color: #f0f0f0;
              border: 2px dashed #67EDE2;
              padding: 20px;
              text-align: center;
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              margin: 20px 0;
              color: #045477;
            }
            .security-notice {
              background-color: #fff3e0;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              border-left: 4px solid #FF9800;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${fullName},</h2>
              <p>We received a request to reset your password for your Tripping Platform account. Use the OTP code below to proceed with resetting your password:</p>
              
              <div class="otp-box">
                ${otp}
              </div>
              
              <p><strong>This OTP is valid for 10 minutes.</strong></p>
              
              <div class="security-notice">
                <strong>🛡️ Security Notice:</strong>
                <p style="margin: 10px 0 0 0;">If you didn't request a password reset, please ignore this email. Your account remains secure.</p>
              </div>
              
              <p>Best regards,<br>The Tripping Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hello ${fullName},\n\nWe received a request to reset your password for your Tripping Platform account.\n\nYour OTP code is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you didn't request a password reset, please ignore this email. Your account remains secure.\n\nBest regards,\nThe Tripping Team`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Forgot password OTP email sent to ${email}`);
    } catch (error) {
      console.error("Failed to send forgot password OTP email:", error);
      throw new Error("Failed to send password reset email");
    }
  },

  /**
   * Send trip approval notification to admin
   * @param adminEmail - Admin email address
   * @param adminName - Admin's full name
   * @param tripDetails - Details of the trip to be approved
   */
  async sendTripApprovalNotification(
    adminEmail: string,
    adminName: string,
    tripDetails: {
      tripId: string;
      tripTitle: string;
      hostName: string;
      hostEmail: string;
      destination: string[];
      pricePerPerson: number;
    },
  ): Promise<void> {
    const mailOptions = {
      from: `"Tripping Platform" <${config.googleEmail}>`,
      to: adminEmail,
      subject: "New Trip Awaiting Approval",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #045477;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .trip-details {
              background-color: #f5f5f5;
              padding: 20px;
              border-left: 4px solid #67EDE2;
              margin: 20px 0;
            }
            .trip-details h3 {
              margin-top: 0;
              color: #045477;
            }
            .detail-row {
              margin: 10px 0;
            }
            .detail-label {
              font-weight: bold;
              color: #555;
            }
            .cta-button {
              display: inline-block;
              background-color: #67EDE2;
              color: #045477;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 New Trip Approval Request</h1>
            </div>
            <div class="content">
              <h2>Hello ${adminName},</h2>
              <p>A new trip has been submitted for approval and requires your review.</p>
              
              <div class="trip-details">
                <h3>${tripDetails.tripTitle}</h3>
                <div class="detail-row">
                  <span class="detail-label">Trip ID:</span> ${tripDetails.tripId}
                </div>
                <div class="detail-row">
                  <span class="detail-label">Host:</span> ${tripDetails.hostName} (${tripDetails.hostEmail})
                </div>
                <div class="detail-row">
                  <span class="detail-label">Destinations:</span> ${tripDetails.destination.join(", ")}
                </div>
                <div class="detail-row">
                  <span class="detail-label">Price per Person:</span> ₹${tripDetails.pricePerPerson}
                </div>
              </div>
              
              <p>Please review this trip and approve or request changes from the admin panel.</p>
              
              <center>
                <a href="${config.adminPanelUrl}/trips" class="cta-button">
                  Review Trip in Admin Panel
                </a>
              </center>
              
              <p>Best regards,<br>The Tripping Platform System</p>
            </div>
            <div class="footer">
              <p>This is an automated notification. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hello ${adminName},\n\nA new trip has been submitted for approval:\n\nTrip: ${tripDetails.tripTitle}\nTrip ID: ${tripDetails.tripId}\nHost: ${tripDetails.hostName} (${tripDetails.hostEmail})\nDestinations: ${tripDetails.destination.join(", ")}\nPrice per Person: ₹${tripDetails.pricePerPerson}\n\nPlease review this trip from the admin panel.\n\nBest regards,\nThe Tripping Platform System`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Trip approval notification sent to admin ${adminEmail}`);
    } catch (error) {
      console.error("Failed to send trip approval notification:", error);
      // Don't throw error - we don't want to fail trip creation if email fails
      console.warn("⚠️ Trip was created but admin notification email failed");
    }
  },

  /**
   * Send trip approved email to host
   */
  async sendTripApprovedEmail(
    hostEmail: string,
    hostName: string,
    tripDetails: {
      tripTitle: string;
      reasons: string[];
      adminMessage?: string;
    },
  ): Promise<void> {
    const mailOptions = {
      from: `"Tripping Platform" <${config.googleEmail}>`,
      to: hostEmail,
      subject: "🎉 Your Trip Has Been Approved!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #045477;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .status-badge {
              display: inline-block;
              background-color: #4CAF50;
              color: white;
              padding: 10px 20px;
              border-radius: 20px;
              font-weight: bold;
              margin: 20px 0;
            }
            .details-box {
              background-color: #f5f5f5;
              padding: 20px;
              border-left: 4px solid #67EDE2;
              margin: 20px 0;
            }
            .reason-item {
              padding: 8px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .reason-item:last-child {
              border-bottom: none;
            }
            .admin-message {
              background-color: #e8f5e9;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              border-left: 4px solid #4CAF50;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Trip Approved!</h1>
            </div>
            <div class="content">
              <h2>Hello ${hostName},</h2>
              <p>Great news! Your trip has been approved and is now published on our platform.</p>
              
              <center>
                <span class="status-badge">✓ APPROVED</span>
              </center>
              
              <div class="details-box">
                <h3 style="color: #045477; margin-top: 0;">${tripDetails.tripTitle}</h3>
                
                <p><strong>Approval Reasons:</strong></p>
                ${tripDetails.reasons.map((reason) => `<div class="reason-item">✓ ${reason}</div>`).join("")}
                
                ${
                  tripDetails.adminMessage
                    ? `
                <div class="admin-message">
                  <strong>Message from Admin:</strong>
                  <p style="margin: 10px 0 0 0;">${tripDetails.adminMessage}</p>
                </div>
                `
                    : ""
                }
              </div>
              
              <p>Your trip is now live and travelers can start booking. You can manage your trip from the host dashboard.</p>
              
              <p>Best regards,<br>The Tripping Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Trip approved email sent to ${hostEmail}`);
    } catch (error) {
      console.error("Failed to send trip approved email:", error);
    }
  },

  /**
   * Send trip rejected email to host
   */
  async sendTripRejectedEmail(
    hostEmail: string,
    hostName: string,
    tripDetails: {
      tripTitle: string;
      reasons: string[];
      adminMessage?: string;
    },
  ): Promise<void> {
    const mailOptions = {
      from: `"Tripping Platform" <${config.googleEmail}>`,
      to: hostEmail,
      subject: "Trip Review Update - Action Required",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #045477;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .status-badge {
              display: inline-block;
              background-color: #f44336;
              color: white;
              padding: 10px 20px;
              border-radius: 20px;
              font-weight: bold;
              margin: 20px 0;
            }
            .details-box {
              background-color: #f5f5f5;
              padding: 20px;
              border-left: 4px solid #67EDE2;
              margin: 20px 0;
            }
            .reason-item {
              padding: 8px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .reason-item:last-child {
              border-bottom: none;
            }
            .admin-message {
              background-color: #ffebee;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              border-left: 4px solid #f44336;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Trip Review Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${hostName},</h2>
              <p>Thank you for submitting your trip. After careful review, we are unable to approve it at this time.</p>
              
              <center>
                <span class="status-badge">✗ REJECTED</span>
              </center>
              
              <div class="details-box">
                <h3 style="color: #045477; margin-top: 0;">${tripDetails.tripTitle}</h3>
                
                <p><strong>Reasons for Rejection:</strong></p>
                ${tripDetails.reasons.map((reason) => `<div class="reason-item">• ${reason}</div>`).join("")}
                
                ${
                  tripDetails.adminMessage
                    ? `
                <div class="admin-message">
                  <strong>Message from Admin:</strong>
                  <p style="margin: 10px 0 0 0;">${tripDetails.adminMessage}</p>
                </div>
                `
                    : ""
                }
              </div>
              
              <p>If you have any questions or would like to discuss this decision, please contact our support team.</p>
              
              <p>Best regards,<br>The Tripping Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Trip rejected email sent to ${hostEmail}`);
    } catch (error) {
      console.error("Failed to send trip rejected email:", error);
    }
  },

  /**
   * Send trip changes requested email to host
   */
  async sendTripChangesRequestedEmail(
    hostEmail: string,
    hostName: string,
    tripDetails: {
      tripTitle: string;
      reasons: string[];
      adminMessage?: string;
    },
  ): Promise<void> {
    const mailOptions = {
      from: `"Tripping Platform" <${config.googleEmail}>`,
      to: hostEmail,
      subject: "Trip Review - Changes Requested",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #045477;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .status-badge {
              display: inline-block;
              background-color: #FF9800;
              color: white;
              padding: 10px 20px;
              border-radius: 20px;
              font-weight: bold;
              margin: 20px 0;
            }
            .details-box {
              background-color: #f5f5f5;
              padding: 20px;
              border-left: 4px solid #67EDE2;
              margin: 20px 0;
            }
            .reason-item {
              padding: 8px 0;
              border-bottom: 1px solid #e0e0e0;
            }
            .reason-item:last-child {
              border-bottom: none;
            }
            .admin-message {
              background-color: #fff3e0;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              border-left: 4px solid #FF9800;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Trip Review Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${hostName},</h2>
              <p>Thank you for submitting your trip. Our team has reviewed it and would like to request some changes before approval.</p>
              
              <center>
                <span class="status-badge">⚠ CHANGES REQUESTED</span>
              </center>
              
              <div class="details-box">
                <h3 style="color: #045477; margin-top: 0;">${tripDetails.tripTitle}</h3>
                
                <p><strong>Requested Changes:</strong></p>
                ${tripDetails.reasons.map((reason) => `<div class="reason-item">• ${reason}</div>`).join("")}
                
                ${
                  tripDetails.adminMessage
                    ? `
                <div class="admin-message">
                  <strong>Message from Admin:</strong>
                  <p style="margin: 10px 0 0 0;">${tripDetails.adminMessage}</p>
                </div>
                `
                    : ""
                }
              </div>
              
              <p>Please make the requested changes and resubmit your trip for approval. You can edit your trip from the host dashboard.</p>
              
              <p>Best regards,<br>The Tripping Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Trip changes requested email sent to ${hostEmail}`);
    } catch (error) {
      console.error("Failed to send trip changes requested email:", error);
    }
  },

  /**
   * Send booking notification to host
   */
  async sendBookingNotificationToHost(details: {
    hostEmail: string;
    hostName: string;
    userName: string;
    userEmail: string;
    tripTitle: string;
    numTravelers: number;
    batchStartDate: string;
    pickupLocation: string;
    userMessage: string;
    totalAmount: number;
  }): Promise<void> {
    const mailOptions = {
      from: `"Tripping Platform" <${config.googleEmail}>`,
      to: details.hostEmail,
      subject: `🎉 New Booking Request for "${details.tripTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #045477;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .status-badge {
              display: inline-block;
              background-color: #FF9800;
              color: white;
              padding: 10px 20px;
              border-radius: 20px;
              font-weight: bold;
              margin: 20px 0;
            }
            .booking-details {
              background-color: #f5f5f5;
              padding: 20px;
              border-left: 4px solid #67EDE2;
              margin: 20px 0;
            }
            .detail-row {
              padding: 10px 0;
              border-bottom: 1px solid #e0e0e0;
              display: flex;
              justify-content: space-between;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: bold;
              color: #555;
            }
            .detail-value {
              color: #045477;
            }
            .user-message {
              background-color: #e3f2fd;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              border-left: 4px solid #2196F3;
            }
            .cta-button {
              display: inline-block;
              background-color: #67EDE2;
              color: #045477;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 New Booking Request!</h1>
            </div>
            <div class="content">
              <h2>Hello ${details.hostName},</h2>
              <p>Great news! Someone is interested in joining your trip and has submitted a booking request.</p>
              
              <center>
                <span class="status-badge">⏳ PENDING APPROVAL</span>
              </center>
              
              <div class="booking-details">
                <h3 style="color: #045477; margin-top: 0;">${details.tripTitle}</h3>
                
                <div class="detail-row">
                  <span class="detail-label">Traveler Name:</span>
                  <span class="detail-value">${details.userName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${details.userEmail}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Number of Travelers:</span>
                  <span class="detail-value">${details.numTravelers}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Batch Start Date:</span>
                  <span class="detail-value">${details.batchStartDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Pickup Location:</span>
                  <span class="detail-value">${details.pickupLocation}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Total Amount:</span>
                  <span class="detail-value">₹${details.totalAmount.toLocaleString()}</span>
                </div>
                
                ${
                  details.userMessage !== "No message provided"
                    ? `
                <div class="user-message">
                  <strong>Message from Traveler:</strong>
                  <p style="margin: 10px 0 0 0;">${details.userMessage}</p>
                </div>
                `
                    : ""
                }
              </div>
              
              <p><strong>Action Required:</strong> Please review this booking request and accept or reject it from your host dashboard.</p>
              
              <center>
                <a href="${config.adminPanelUrl}/host" class="cta-button">
                  View Booking Request
                </a>
              </center>
              
              <p>Best regards,<br>The Tripping Team</p>
            </div>
            <div class="footer">
              <p>This is an automated notification. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hello ${details.hostName},\n\nGreat news! Someone is interested in joining your trip "${details.tripTitle}".\n\nBooking Details:\n- Traveler: ${details.userName} (${details.userEmail})\n- Number of Travelers: ${details.numTravelers}\n- Batch Start Date: ${details.batchStartDate}\n- Pickup Location: ${details.pickupLocation}\n- Total Amount: ₹${details.totalAmount.toLocaleString()}\n\nMessage from Traveler:\n${details.userMessage}\n\nPlease review this booking request from your host dashboard.\n\nBest regards,\nThe Tripping Team`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Booking notification sent to host ${details.hostEmail}`);
    } catch (error) {
      console.error("Failed to send booking notification to host:", error);
      throw error;
    }
  },

  /**
   * Send booking rejection email to user
   */
  async sendBookingRejectionToUser(details: {
    userEmail: string;
    userName: string;
    tripTitle: string;
    reason: string;
  }): Promise<void> {
    const mailOptions = {
      from: `"Tripping Platform" <${config.googleEmail}>`,
      to: details.userEmail,
      subject: `Booking Update for "${details.tripTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #045477;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .status-badge {
              display: inline-block;
              background-color: #f44336;
              color: white;
              padding: 10px 20px;
              border-radius: 20px;
              font-weight: bold;
              margin: 20px 0;
            }
            .trip-details {
              background-color: #f5f5f5;
              padding: 20px;
              border-left: 4px solid #67EDE2;
              margin: 20px 0;
            }
            .reason-box {
              background-color: #ffebee;
              padding: 15px;
              border-radius: 5px;
              margin: 15px 0;
              border-left: 4px solid #f44336;
            }
            .cta-button {
              display: inline-block;
              background-color: #67EDE2;
              color: #045477;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${details.userName},</h2>
              <p>Thank you for your interest in our trip. We regret to inform you that your booking request has not been accepted by the host.</p>
              
              <center>
                <span class="status-badge">✗ BOOKING NOT ACCEPTED</span>
              </center>
              
              <div class="trip-details">
                <h3 style="color: #045477; margin-top: 0;">${details.tripTitle}</h3>
                
                <div class="reason-box">
                  <strong>Reason:</strong>
                  <p style="margin: 10px 0 0 0;">${details.reason}</p>
                </div>
              </div>
              
              <p>We understand this may be disappointing. Please don't let this discourage you from exploring other amazing trips on our platform!</p>
              
              <center>
                <a href="${config.adminPanelUrl}/trips" class="cta-button">
                  Browse Other Trips
                </a>
              </center>
              
              <p>If you have any questions, please feel free to contact our support team.</p>
              
              <p>Best regards,<br>The Tripping Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hello ${details.userName},\n\nThank you for your interest in "${details.tripTitle}". We regret to inform you that your booking request has not been accepted by the host.\n\nReason: ${details.reason}\n\nWe understand this may be disappointing. Please don't let this discourage you from exploring other amazing trips on our platform!\n\nIf you have any questions, please contact our support team.\n\nBest regards,\nThe Tripping Team`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Booking rejection email sent to ${details.userEmail}`);
    } catch (error) {
      console.error("Failed to send booking rejection email:", error);
      throw error;
    }
  },

  /**
   * Send booking confirmation email to user
   */
  async sendBookingConfirmationToUser(details: {
    userEmail: string;
    userName: string;
    tripTitle: string;
    numTravelers: number;
    batchStartDate: string;
    pickupLocation: string;
    totalAmount: number;
    bookingId: string;
  }): Promise<void> {
    const mailOptions = {
      from: `"Tripping Platform" <${config.googleEmail}>`,
      to: details.userEmail,
      subject: `🎉 Trip Confirmed! Complete Payment for "${details.tripTitle}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #045477;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .status-badge {
              display: inline-block;
              background-color: #4CAF50;
              color: white;
              padding: 10px 20px;
              border-radius: 20px;
              font-weight: bold;
              margin: 20px 0;
            }
            .booking-details {
              background-color: #f5f5f5;
              padding: 20px;
              border-left: 4px solid #67EDE2;
              margin: 20px 0;
            }
            .detail-row {
              padding: 10px 0;
              border-bottom: 1px solid #e0e0e0;
              display: flex;
              justify-content: space-between;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: bold;
              color: #555;
            }
            .detail-value {
              color: #045477;
            }
            .payment-box {
              background-color: #fff3e0;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              border-left: 4px solid #FF9800;
              text-align: center;
            }
            .payment-box h3 {
              color: #FF9800;
              margin-top: 0;
            }
            .amount-highlight {
              font-size: 32px;
              font-weight: bold;
              color: #045477;
              margin: 15px 0;
            }
            .cta-button {
              display: inline-block;
              background-color: #67EDE2;
              color: #045477;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
              font-size: 18px;
            }
            .warning-text {
              color: #f44336;
              font-weight: bold;
              margin: 15px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Your Trip is Confirmed!</h1>
            </div>
            <div class="content">
              <h2>Hello ${details.userName},</h2>
              <p>Great news! The host has confirmed your booking request. Your spot is reserved, but you need to complete the payment to finalize your booking.</p>
              
              <center>
                <span class="status-badge">✓ CONFIRMED - PAYMENT PENDING</span>
              </center>
              
              <div class="booking-details">
                <h3 style="color: #045477; margin-top: 0;">${details.tripTitle}</h3>
                
                <div class="detail-row">
                  <span class="detail-label">Booking ID:</span>
                  <span class="detail-value">${details.bookingId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Number of Travelers:</span>
                  <span class="detail-value">${details.numTravelers}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Trip Start Date:</span>
                  <span class="detail-value">${details.batchStartDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Pickup Location:</span>
                  <span class="detail-value">${details.pickupLocation}</span>
                </div>
              </div>
              
              <div class="payment-box">
                <h3>⚠️ Payment Required</h3>
                <p>Complete your payment to secure your spot on this amazing trip!</p>
                <div class="amount-highlight">₹${details.totalAmount.toLocaleString()}</div>
                <p class="warning-text">Your booking will be cancelled if payment is not completed within 24 hours.</p>
                
                <center>
                  <a href="${config.adminPanelUrl}/payment/${details.bookingId}" class="cta-button">
                    Complete Payment Now
                  </a>
                </center>
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Click the "Complete Payment Now" button above</li>
                <li>Choose your preferred payment method</li>
                <li>Complete the payment securely</li>
                <li>Receive your booking confirmation</li>
              </ol>
              
              <p>If you have any questions or need assistance, please contact our support team.</p>
              
              <p>Best regards,<br>The Tripping Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hello ${details.userName},\n\nGreat news! The host has confirmed your booking for "${details.tripTitle}".\n\nBooking Details:\n- Booking ID: ${details.bookingId}\n- Number of Travelers: ${details.numTravelers}\n- Trip Start Date: ${details.batchStartDate}\n- Pickup Location: ${details.pickupLocation}\n- Total Amount: ₹${details.totalAmount.toLocaleString()}\n\n⚠️ PAYMENT REQUIRED\nYour spot is reserved, but you need to complete the payment to finalize your booking.\n\nAmount Due: ₹${details.totalAmount.toLocaleString()}\n\nYour booking will be cancelled if payment is not completed within 24 hours.\n\nPlease complete your payment at: ${config.adminPanelUrl}/bookings/${details.bookingId}/payment\n\nBest regards,\nThe Tripping Team`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Booking confirmation email sent to ${details.userEmail}`);
    } catch (error) {
      console.error("Failed to send booking confirmation email:", error);
      throw error;
    }
  },

  /**
   * Send booking confirmed email to user (after payment success)
   */
  async sendBookingConfirmedToUser(details: {
    userEmail: string;
    userName: string;
    tripTitle: string;
    numTravelers: number;
    batchStartDate: string;
    batchEndDate: string;
    pickupLocation: string;
    totalAmount: number;
    bookingId: string;
    hostName: string;
    hostEmail: string;
    hostPhone: string;
  }): Promise<void> {
    const mailOptions = {
      from: `"Tripping Platform" <${config.googleEmail}>`,
      to: details.userEmail,
      subject: `🎉 Booking Confirmed - ${details.tripTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #045477;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .status-badge {
              display: inline-block;
              background-color: #4CAF50;
              color: white;
              padding: 10px 20px;
              border-radius: 20px;
              font-weight: bold;
              margin: 20px 0;
            }
            .booking-details {
              background-color: #f5f5f5;
              padding: 20px;
              border-left: 4px solid #67EDE2;
              margin: 20px 0;
            }
            .detail-row {
              padding: 10px 0;
              border-bottom: 1px solid #e0e0e0;
              display: flex;
              justify-content: space-between;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: bold;
              color: #555;
            }
            .detail-value {
              color: #045477;
            }
            .host-box {
              background-color: #e3f2fd;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
              border-left: 4px solid #2196F3;
            }
            .host-box h3 {
              color: #045477;
              margin-top: 0;
            }
            .success-icon {
              font-size: 48px;
              text-align: center;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Booking Confirmed!</h1>
            </div>
            <div class="content">
              <div class="success-icon">✅</div>
              
              <h2>Hello ${details.userName},</h2>
              <p>Congratulations! Your payment has been received and your booking is now confirmed.</p>
              
              <center>
                <span class="status-badge">✓ CONFIRMED & PAID</span>
              </center>
              
              <div class="booking-details">
                <h3 style="color: #045477; margin-top: 0;">${details.tripTitle}</h3>
                
                <div class="detail-row">
                  <span class="detail-label">Booking ID:</span>
                  <span class="detail-value">${details.bookingId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Number of Travelers:</span>
                  <span class="detail-value">${details.numTravelers}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Trip Start Date:</span>
                  <span class="detail-value">${details.batchStartDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Trip End Date:</span>
                  <span class="detail-value">${details.batchEndDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Pickup Location:</span>
                  <span class="detail-value">${details.pickupLocation}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Total Amount Paid:</span>
                  <span class="detail-value">₹${details.totalAmount.toLocaleString()}</span>
                </div>
              </div>
              
              <div class="host-box">
                <h3>📞 Your Host Details</h3>
                <p><strong>Name:</strong> ${details.hostName}</p>
                <p><strong>Email:</strong> <a href="mailto:${details.hostEmail}">${details.hostEmail}</a></p>
                <p><strong>Phone:</strong> ${details.hostPhone}</p>
                <p style="margin-top: 15px; font-size: 14px; color: #666;">
                  Your host will contact you closer to the trip date with final details and instructions.
                </p>
              </div>
              
              <p><strong>What's Next?</strong></p>
              <ul>
                <li>Save this email for your records</li>
                <li>Your host will reach out with trip details</li>
                <li>Prepare for an amazing adventure!</li>
              </ul>
              
              <p>If you have any questions, feel free to contact your host or our support team.</p>
              
              <p>Best regards,<br>The Tripping Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Hello ${details.userName},\n\nCongratulations! Your payment has been received and your booking is now confirmed.\n\nBooking Details:\n- Booking ID: ${details.bookingId}\n- Trip: ${details.tripTitle}\n- Number of Travelers: ${details.numTravelers}\n- Trip Start Date: ${details.batchStartDate}\n- Trip End Date: ${details.batchEndDate}\n- Pickup Location: ${details.pickupLocation}\n- Total Amount Paid: ₹${details.totalAmount.toLocaleString()}\n\nYour Host Details:\n- Name: ${details.hostName}\n- Email: ${details.hostEmail}\n- Phone: ${details.hostPhone}\n\nYour host will contact you closer to the trip date with final details and instructions.\n\nBest regards,\nThe Tripping Team`,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Booking confirmation email sent to ${details.userEmail}`);
    } catch (error) {
      console.error("Failed to send booking confirmation email:", error);
      throw error;
    }
  },
};

export default emailService;
