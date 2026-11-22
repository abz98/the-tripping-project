import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { TripsService } from "../services/trips.service";
import { SearchService } from "../services/search.service";

@Component({
  selector: "app-all-trips",
  standalone: false,
  templateUrl: "./all-trips.html",
  styleUrl: "./all-trips.css",
})
export class AllTrips implements OnInit {
  trips: any[] = [];
  loading = false;
  error = false;
  errorMessage = "";

  // Query parameters
  searchQuery = "";
  travellers: number | null = null;
  formattedDate = "";
  startDate = "";
  categoryId!: string;

  constructor(
    private route: ActivatedRoute,
    private tripsService: TripsService,
    private searchService: SearchService,
  ) {}

  ngOnInit() {
    // Subscribe to search service
    this.searchService.searchTriggered$.subscribe((searchParams) => {
      this.onSearchTriggered(searchParams);
    });

    // Subscribe to query parameters
    this.route.queryParams.subscribe((params) => {
      // Extract query parameters
      if (params["searchQuery"]) {
        this.searchQuery = decodeURIComponent(params["searchQuery"]);
      }

      if (params["travellers"]) {
        this.travellers = parseInt(params["travellers"], 10);
      }

      if (params["formattedDate"]) {
        this.formattedDate = decodeURIComponent(params["formattedDate"]);
        // Convert formatted date to ISO format for API
        this.startDate = this.parseFormattedDateToISO(this.formattedDate);
      }
      if (params["categoryId"]) {
        this.categoryId = decodeURIComponent(params["categoryId"]);
      }
      // Load trips with filters
      this.loadTrips();
    });
  }

  parseFormattedDateToISO(dateStr: string): string {
    try {
      // Parse format like "22 Jan 2026" to "2026-01-22"
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const parts = dateStr.split(" ");
      if (parts.length !== 3) return "";

      const day = parts[0].padStart(2, "0");
      const monthStr = parts[1];
      const year = parts[2];

      const monthIndex = monthNames.findIndex(
        (m) => m.toLowerCase() === monthStr.toLowerCase(),
      );

      if (monthIndex === -1) return "";

      const month = (monthIndex + 1).toString().padStart(2, "0");

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error parsing date:", error);
      return "";
    }
  }

  loadTrips() {
    this.loading = true;
    this.error = false;

    // Build query parameters for API
    const queryParams: any = {};

    if (this.searchQuery) {
      queryParams.destination = this.searchQuery;
    }

    if (this.travellers) {
      queryParams.travellers = this.travellers;
    }

    if (this.startDate) {
      queryParams.startDate = this.startDate;
    }
    if (this.categoryId) {
      // Call the API with query parameters
      this.tripsService.getTripsByCategory(this.categoryId).subscribe({
        next: (response) => {
          if (response && response.data) {
            this.trips = response.data;
          } else {
            this.trips = [];
          }
          this.loading = false;
        },
        error: (error) => {
          console.error("Error loading trips:", error);
          this.error = true;
          this.errorMessage = "Failed to load trips. Please try again.";
          this.loading = false;
        },
      });
    } else {
      // Call the API with query parameters
      this.tripsService.getAllTrips(queryParams).subscribe({
        next: (response) => {
          if (response && response.data) {
            this.trips = response.data;
          } else {
            this.trips = [];
          }
          this.loading = false;
        },
        error: (error) => {
          console.error("Error loading trips:", error);
          this.error = true;
          this.errorMessage = "Failed to load trips. Please try again.";
          this.loading = false;
        },
      });
    }
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return "";

    const date = new Date(dateStr);
    const day = date.getDate();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[date.getMonth()];

    return `${day} ${month}`;
  }

  onSearchTriggered(searchParams: any) {
    console.log("Search triggered from search bar:", searchParams);

    // Update local properties
    this.searchQuery = searchParams.searchQuery || "";
    this.travellers = searchParams.travellers || null;
    this.formattedDate = searchParams.formattedDate || "";

    if (this.formattedDate) {
      this.startDate = this.parseFormattedDateToISO(this.formattedDate);
    } else {
      this.startDate = "";
    }

    // Reload trips with new parameters
    this.loadTrips();
  }
}
