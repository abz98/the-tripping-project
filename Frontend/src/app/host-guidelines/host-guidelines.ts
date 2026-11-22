import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-host-guidelines",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./host-guidelines.html",
  styleUrls: ["./host-guidelines.css"],
})
export class HostGuidelinesComponent {
  guidelines = [
    {
      category: "Creating Your Listing",
      icon: "📝",
      rules: [
        "Provide accurate and detailed descriptions of your trip",
        "Use high-quality, recent photos that represent the actual experience",
        "Set fair and competitive pricing",
        "Clearly state what is included and excluded in the trip",
        "Specify any physical requirements or restrictions",
        "Keep your availability calendar up to date",
      ],
    },
    {
      category: "Communication",
      icon: "💬",
      rules: [
        "Respond to inquiries within 24 hours",
        "Be clear and professional in all communications",
        "Provide detailed pre-trip information to travelers",
        "Keep travelers updated about any changes",
        "Be available during the trip for questions or emergencies",
        "Follow up after the trip for feedback",
      ],
    },
    {
      category: "Safety & Security",
      icon: "🛡️",
      rules: [
        "Ensure all activities meet safety standards",
        "Provide necessary safety equipment and instructions",
        "Have emergency contact information readily available",
        "Verify traveler identities before the trip",
        "Maintain appropriate insurance coverage",
        "Follow local laws and regulations",
      ],
    },
    {
      category: "During the Trip",
      icon: "🎯",
      rules: [
        "Arrive on time and be prepared",
        "Deliver the experience as described in your listing",
        "Be respectful and professional with all travelers",
        "Accommodate reasonable requests when possible",
        "Handle issues promptly and professionally",
        "Ensure a clean and safe environment",
      ],
    },
    {
      category: "Cancellations & Changes",
      icon: "📅",
      rules: [
        "Honor your cancellation policy consistently",
        "Avoid canceling confirmed bookings",
        "Notify travelers immediately of any necessary changes",
        "Offer alternatives or refunds when appropriate",
        "Document all cancellations and changes",
        "Communicate with TripWiz support for major issues",
      ],
    },
    {
      category: "Reviews & Ratings",
      icon: "⭐",
      rules: [
        "Encourage honest feedback from travelers",
        "Respond professionally to all reviews",
        "Use feedback to improve your offerings",
        "Never pressure travelers for positive reviews",
        "Address negative feedback constructively",
        "Maintain high standards to earn good ratings",
      ],
    },
  ];

  bestPractices = [
    "Go above and beyond to create memorable experiences",
    "Build your reputation through consistent quality",
    "Stay informed about local attractions and events",
    "Continuously improve based on traveler feedback",
    "Network with other hosts to share tips and insights",
    "Keep learning and adapting to traveler preferences",
  ];
}
