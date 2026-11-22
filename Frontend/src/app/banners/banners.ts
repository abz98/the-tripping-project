import { Component, OnInit } from "@angular/core";
import { HomepageService, Banner } from "../services/homepage.service";

@Component({
  selector: "app-banners",
  standalone: false,
  templateUrl: "./banners.html",
  styleUrl: "./banners.css",
})
export class Banners implements OnInit {
  banners: Banner[] = [];
  currentSlideIndex: number = 0;
  isLoading: boolean = true;
  error: string | null = null;

  constructor(private homepageService: HomepageService) {}

  ngOnInit(): void {
    this.loadBanners();
  }

  loadBanners(): void {
    this.isLoading = true;
    this.homepageService.getBanners().subscribe({
      next: (response) => {
        if (response.status === "success" && response.data) {
          // Filter by is_active only if the field exists
          this.banners = response.data.filter(
            (banner) => banner.is_active !== false,
          );
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error("Error fetching banners:", error);
        this.error = "Failed to load banners";
        this.isLoading = false;
      },
    });
  }

  nextSlide(): void {
    if (this.banners.length > 0) {
      this.currentSlideIndex =
        (this.currentSlideIndex + 1) % this.banners.length;
    }
  }

  prevSlide(): void {
    if (this.banners.length > 0) {
      this.currentSlideIndex =
        (this.currentSlideIndex - 1 + this.banners.length) %
        this.banners.length;
    }
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
  }

  get currentBanner(): Banner | null {
    return this.banners.length > 0
      ? this.banners[this.currentSlideIndex]
      : null;
  }
}
