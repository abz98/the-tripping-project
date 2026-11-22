import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-cancellation-policy",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./cancellation-policy.html",
  styleUrls: ["./cancellation-policy.css"],
})
export class CancellationPolicyComponent {
  policies = [
    {
      type: "Days Free Cancellation",
      icon: "📅",
      description:
        "Cancellations allowed up to a specified number of days before the host confirms final travellers.",
      details: [
        "Full refund if cancelled within the specified timeframe",
        "The number of days varies by trip (typically 7-14 days)",
        "Check individual trip details for specific cancellation window",
        "Refund processed within 5-7 business days",
      ],
    },
    {
      type: "Flexible Cancellation",
      icon: "✅",
      description: "Cancel anytime before the trip starts and get a refund.",
      details: [
        "Maximum flexibility for travellers",
        "Full refund if cancelled before trip start date",
        "No questions asked cancellation policy",
        "Refund processed within 5-7 business days",
        "Ideal for uncertain travel plans",
      ],
    },
    {
      type: "No Cancellation",
      icon: "🚫",
      description: "This trip is non-refundable once booked.",
      details: [
        "No refunds available after booking",
        "Usually offered at discounted rates",
        "Booking is final and cannot be cancelled",
        "Consider travel insurance for protection",
        "Best for confirmed travel plans",
      ],
    },
  ];

  generalTerms = [
    "Refunds are processed to the original payment method",
    "Processing time may vary depending on your bank or card issuer",
    "Service fees may be non-refundable depending on the policy type",
    "Host-specific policies may apply - always check trip details",
    "In case of host cancellation, full refund is guaranteed",
  ];
}
