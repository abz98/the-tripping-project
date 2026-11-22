import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-terms-conditions",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./terms-conditions.html",
  styleUrls: ["./terms-conditions.css"],
})
export class TermsConditionsComponent {
  lastUpdated = "January 15, 2026";

  sections = [
    {
      title: "Acceptance of Terms",
      content:
        "By accessing and using TripWiz, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our service.",
    },
    {
      title: "User Accounts",
      content:
        "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.",
    },
    {
      title: "Booking and Payments",
      content:
        "All bookings are subject to availability and confirmation. Prices are subject to change without notice. Payment must be made in full at the time of booking unless otherwise specified. We accept major credit cards and other payment methods as indicated on our platform.",
    },
    {
      title: "Host Responsibilities",
      content:
        "Hosts are responsible for the accuracy of their trip listings, including descriptions, photos, pricing, and availability. Hosts must provide services as described and maintain appropriate insurance and licenses as required by law.",
    },
    {
      title: "Traveller Responsibilities",
      content:
        "Travellers must provide accurate information when booking. You are responsible for ensuring you have appropriate travel documents, insurance, and meet any requirements for the trip. Respectful behavior towards hosts and other travellers is expected.",
    },
    {
      title: "Cancellations and Refunds",
      content:
        "Cancellation policies vary by trip and are clearly stated in each listing. Please review the specific cancellation policy before booking. Refunds are processed according to the applicable cancellation policy.",
    },
    {
      title: "Liability and Disclaimers",
      content:
        "TripWiz acts as a platform connecting hosts and travellers. We are not responsible for the actions of hosts or travellers. Use of our service is at your own risk. We recommend purchasing travel insurance for additional protection.",
    },
    {
      title: "Intellectual Property",
      content:
        "All content on TripWiz, including text, graphics, logos, and software, is the property of TripWiz or its content suppliers and is protected by copyright and intellectual property laws.",
    },
    {
      title: "Privacy and Data Protection",
      content:
        "Your privacy is important to us. We collect and use your personal information in accordance with our Privacy Policy. By using TripWiz, you consent to our collection and use of your data as described.",
    },
    {
      title: "Prohibited Activities",
      content:
        "Users may not use TripWiz for any illegal purposes, to transmit harmful content, to harass others, or to circumvent our platform for direct bookings. Violation of these terms may result in account suspension or termination.",
    },
    {
      title: "Dispute Resolution",
      content:
        "Any disputes arising from the use of TripWiz shall be resolved through binding arbitration in accordance with applicable laws. Both parties agree to waive their right to a jury trial.",
    },
    {
      title: "Modifications to Terms",
      content:
        "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of TripWiz after changes constitutes acceptance of the modified terms.",
    },
    {
      title: "Contact Information",
      content:
        "If you have questions about these Terms & Conditions, please contact us at legal@tripwiz.com or through our Contact Us page.",
    },
  ];
}
