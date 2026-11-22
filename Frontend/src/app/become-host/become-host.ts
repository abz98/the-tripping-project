import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";

@Component({
  selector: "app-become-host",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./become-host.html",
  styleUrls: ["./become-host.css"],
})
export class BecomeHostComponent {
  constructor(private router: Router) {}

  benefits = [
    {
      icon: "💰",
      title: "Earn Extra Income",
      description:
        "Turn your passion for travel into profit. Set your own prices and earn money sharing unique experiences.",
    },
    {
      icon: "🌍",
      title: "Share Your World",
      description:
        "Showcase your local knowledge and favorite destinations. Help travelers discover hidden gems.",
    },
    {
      icon: "🤝",
      title: "Meet New People",
      description:
        "Connect with travelers from around the world. Build lasting friendships and expand your network.",
    },
    {
      icon: "📅",
      title: "Flexible Schedule",
      description:
        "Host on your own terms. Choose when and how often you want to offer trips.",
    },
  ];

  steps = [
    {
      number: 1,
      title: "Create Your Account",
      description:
        "Sign up and complete your host profile with photos and information about yourself.",
    },
    {
      number: 2,
      title: "List Your Trip",
      description:
        "Add trip details, photos, pricing, and availability. Make it appealing to travelers.",
    },
    {
      number: 3,
      title: "Get Approved",
      description:
        "Our team reviews your listing to ensure quality standards. Usually takes 24-48 hours.",
    },
    {
      number: 4,
      title: "Start Hosting",
      description:
        "Receive bookings, communicate with travelers, and start earning money!",
    },
  ];

  requirements = [
    "Must be 18 years or older",
    "Valid government-issued ID",
    "Ability to provide safe and quality experiences",
    "Good communication skills",
    "Reliable internet connection for managing bookings",
  ];

  navigateToHostPanel() {
    this.router.navigate(["/host"]);
  }
}
