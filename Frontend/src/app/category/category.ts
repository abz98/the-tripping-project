import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { HomepageService, CategoryItem } from "../services/homepage.service";

@Component({
  selector: "app-category",
  standalone: false,
  templateUrl: "./category.html",
  styleUrl: "./category.css",
})
export class Category implements OnInit {
  categories: CategoryItem[] = [];
  seasonCategories: CategoryItem[] = [];
  destinationCategories: CategoryItem[] = [];
  experienceCategories: CategoryItem[] = [];
  activeTab: "EXPERIENCE" | "DESTINATION" | "SEASON" = "EXPERIENCE";
  isLoading: boolean = true;
  error: string | null = null;

  constructor(
    private homepageService: HomepageService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.homepageService.getCategories().subscribe({
      next: (response) => {
        if (response.status === "success" && response.data) {
          // Filter by is_active only if the field exists
          this.categories = response.data.filter(
            (category) => category.is_active !== false,
          );

          // Group categories by type
          this.seasonCategories = this.categories.filter(
            (cat) => cat.type === "SEASON",
          );
          this.destinationCategories = this.categories.filter(
            (cat) => cat.type === "DESTINATION",
          );
          this.experienceCategories = this.categories.filter(
            (cat) => cat.type === "EXPERIENCE",
          );

          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error("Error fetching categories:", error);
        this.error = "Failed to load categories";
        this.isLoading = false;
      },
    });
  }

  switchTab(type: "EXPERIENCE" | "DESTINATION" | "SEASON"): void {
    this.activeTab = type;
  }

  get currentCategories(): CategoryItem[] {
    switch (this.activeTab) {
      case "EXPERIENCE":
        return this.experienceCategories;
      case "DESTINATION":
        return this.destinationCategories;
      case "SEASON":
        return this.seasonCategories;
      default:
        return this.experienceCategories;
    }
  }

  navigateToTrips(categoryId: string): void {
    this.router.navigate(["/home/allTrips"], {
      queryParams: { categoryId: categoryId },
    });
  }
}
