import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-privacy-policy",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./privacy-policy.html",
  styleUrls: ["./privacy-policy.css"],
})
export class PrivacyPolicyComponent {
  lastUpdated = "January 15, 2026";

  sections = [
    {
      title: "Information We Collect",
      content:
        "We collect information you provide directly to us, including your name, email address, phone number, payment information, and profile details. We also collect information about your bookings, trip preferences, and communication with hosts or other users.",
    },
    {
      title: "How We Use Your Information",
      content:
        "We use your information to provide and improve our services, process bookings and payments, communicate with you about your trips, send promotional materials (with your consent), prevent fraud, and comply with legal obligations.",
    },
    {
      title: "Information Sharing",
      content:
        "We share your information with hosts when you make a booking, with payment processors to complete transactions, with service providers who assist our operations, and when required by law. We do not sell your personal information to third parties.",
    },
    {
      title: "Cookies and Tracking",
      content:
        "We use cookies and similar technologies to enhance your experience, analyze usage patterns, remember your preferences, and deliver personalized content. You can control cookie settings through your browser preferences.",
    },
    {
      title: "Data Security",
      content:
        "We implement industry-standard security measures to protect your personal information, including encryption, secure servers, and regular security audits. However, no method of transmission over the internet is 100% secure.",
    },
    {
      title: "Your Rights and Choices",
      content:
        "You have the right to access, update, or delete your personal information. You can opt-out of marketing communications, request a copy of your data, and object to certain processing activities. Contact us to exercise these rights.",
    },
    {
      title: "Data Retention",
      content:
        "We retain your personal information for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. You can request deletion of your account at any time.",
    },
    {
      title: "Children's Privacy",
      content:
        "TripWiz is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware of such collection, we will take steps to delete the information.",
    },
    {
      title: "International Data Transfers",
      content:
        "Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with applicable privacy laws.",
    },
    {
      title: "Third-Party Links",
      content:
        "Our platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any information.",
    },
    {
      title: "Changes to Privacy Policy",
      content:
        "We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through a notice on our platform. Your continued use after changes constitutes acceptance of the updated policy.",
    },
    {
      title: "Contact Us",
      content:
        "If you have questions or concerns about this Privacy Policy or our data practices, please contact us at privacy@tripwiz.com or through our Contact Us page.",
    },
  ];
}
