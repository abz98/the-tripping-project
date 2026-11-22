import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-help-center",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./help-center.html",
  styleUrls: ["./help-center.css"],
})
export class HelpCenterComponent {
  faqSections = [
    {
      category: "Booking & Reservations",
      faqs: [
        {
          question: "How do I book a trip?",
          answer:
            'Browse available trips, select your preferred dates, and click "Book Now". Follow the checkout process to complete your reservation.',
        },
        {
          question: "Can I cancel my booking?",
          answer:
            "Yes, you can cancel your booking up to 48 hours before the trip start date for a full refund. Check the specific trip's cancellation policy for details.",
        },
        {
          question: "How do I modify my reservation?",
          answer:
            'Go to your profile, select "My Trips", and click on the booking you want to modify. You can change dates subject to availability.',
        },
      ],
    },
    {
      category: "Payments",
      faqs: [
        {
          question: "What payment methods do you accept?",
          answer:
            "We accept all major credit cards (Visa, MasterCard, American Express), debit cards, and PayPal.",
        },
        {
          question: "When will I be charged?",
          answer:
            "Your payment is processed immediately upon booking confirmation. You'll receive a receipt via email.",
        },
        {
          question: "Is my payment information secure?",
          answer:
            "Yes, we use industry-standard encryption and secure payment gateways to protect your financial information.",
        },
      ],
    },
    {
      category: "Host Information",
      faqs: [
        {
          question: "How do I become a host?",
          answer:
            "Create an account, navigate to the Host Panel, and follow the steps to list your first trip. Our team will review and approve your listing.",
        },
        {
          question: "What commission does TripWiz charge?",
          answer:
            "We charge a 15% service fee on each booking. This covers payment processing, customer support, and platform maintenance.",
        },
        {
          question: "How do I receive payments as a host?",
          answer:
            "Payments are transferred to your registered bank account within 3-5 business days after the trip completion.",
        },
      ],
    },
    {
      category: "Account & Profile",
      faqs: [
        {
          question: "How do I reset my password?",
          answer:
            'Click "Forgot Password" on the login page, enter your email, and follow the instructions sent to your inbox.',
        },
        {
          question: "Can I update my profile information?",
          answer:
            'Yes, go to your profile page and click "Edit Profile" to update your personal information, photo, and preferences.',
        },
      ],
    },
  ];
}
