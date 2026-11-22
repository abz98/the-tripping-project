import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-traveller-reviews",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./traveller-reviews.html",
  styleUrls: ["./traveller-reviews.css"],
})
export class TravellerReviewsComponent {
  overallRating = 4.8;
  totalReviews = 2847;

  ratingBreakdown = [
    { stars: 5, count: 2156, percentage: 76 },
    { stars: 4, count: 512, percentage: 18 },
    { stars: 3, count: 142, percentage: 5 },
    { stars: 2, count: 28, percentage: 1 },
    { stars: 1, count: 9, percentage: 0 },
  ];

  reviews = [
    {
      name: "Sarah Johnson",
      location: "New York, USA",
      rating: 5,
      date: "January 10, 2026",
      tripName: "Mountain Hiking Adventure",
      comment:
        "Absolutely incredible experience! The host was knowledgeable, friendly, and made sure everyone felt safe. The views were breathtaking and the entire trip was well-organized. Highly recommend!",
      verified: true,
    },
    {
      name: "Michael Chen",
      location: "Toronto, Canada",
      rating: 5,
      date: "January 8, 2026",
      tripName: "City Food Tour",
      comment:
        "Best food tour I've ever been on! We discovered amazing local spots I would never have found on my own. The host's passion for food and culture really showed. Worth every penny!",
      verified: true,
    },
    {
      name: "Emma Williams",
      location: "London, UK",
      rating: 4,
      date: "January 5, 2026",
      tripName: "Coastal Kayaking Experience",
      comment:
        "Great trip overall! The kayaking was fun and the scenery was beautiful. Only minor issue was the weather, but that's not something the host can control. Would definitely book again.",
      verified: true,
    },
    {
      name: "David Martinez",
      location: "Barcelona, Spain",
      rating: 5,
      date: "January 3, 2026",
      tripName: "Photography Walking Tour",
      comment:
        "As a photography enthusiast, this was perfect! The host knew all the best spots and gave great tips on composition and lighting. Came away with amazing photos and new skills.",
      verified: true,
    },
    {
      name: "Lisa Anderson",
      location: "Sydney, Australia",
      rating: 5,
      date: "December 28, 2025",
      tripName: "Wine Tasting Experience",
      comment:
        "Wonderful day exploring local wineries! The host was professional, entertaining, and clearly passionate about wine. Learned so much and tasted some incredible wines. Highly recommended!",
      verified: true,
    },
    {
      name: "James Brown",
      location: "Chicago, USA",
      rating: 4,
      date: "December 25, 2025",
      tripName: "Historical Walking Tour",
      comment:
        "Very informative tour with lots of interesting historical facts. The host was engaging and answered all our questions. Would have liked a bit more time at each location, but overall great experience.",
      verified: true,
    },
    {
      name: "Sophie Dubois",
      location: "Paris, France",
      rating: 5,
      date: "December 22, 2025",
      tripName: "Sunset Sailing Trip",
      comment:
        "Magical experience! The sunset was stunning and the host made everyone feel welcome. Perfect mix of relaxation and adventure. This was the highlight of our vacation!",
      verified: true,
    },
    {
      name: "Tom Wilson",
      location: "Seattle, USA",
      rating: 5,
      date: "December 20, 2025",
      tripName: "Rock Climbing Adventure",
      comment:
        "Excellent instruction and safety measures. The host was patient with beginners and challenged the more experienced climbers. Great equipment and beautiful location. Will be back!",
      verified: true,
    },
  ];

  getStarArray(rating: number): boolean[] {
    return Array(5)
      .fill(false)
      .map((_, i) => i < rating);
  }
}
