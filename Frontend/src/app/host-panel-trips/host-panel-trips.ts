import { Component, Input, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TripsService, Trip } from "../services/trips.service";

@Component({
  selector: "app-host-panel-trips",
  standalone: false,
  templateUrl: "./host-panel-trips.html",
  styleUrl: "./host-panel-trips.css",
})
export class HostPanelTrips implements OnInit {
  trips: Trip[] = [];
  filteredTrips: Trip[] = [];
  bookingRequests: any[] = [];
  isLoading = false;
  activeSection: string = "active";
  showDeleteModal = false;
  tripToDelete: string | null = null;
  showReasonModal = false;
  rejectionData: any = null;
  showBookingRejectionModal = false;
  bookingToReject: string | null = null;
  showBookingAcceptanceModal = false;
  bookingToAccept: string | null = null;

  @Input() set activeTab(value: string) {
    if (value) {
      this.activeSection = value;
      if (value === "Trip Requests") {
        this.loadBookingRequests();
      } else {
        this.filterTrips();
      }
    }
  }
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tripsService: TripsService,
  ) {}

  ngOnInit() {
    if (this.activeSection === "Trip Requests") {
      this.loadBookingRequests();
    } else {
      this.loadTrips();
    }
  }

  loadTrips() {
    this.isLoading = true;
    this.tripsService.getHostTrips().subscribe({
      next: (response) => {
        console.log("Trips loaded:", response);
        this.trips = response.data;
        this.filterTrips();
        this.isLoading = false;
      },
      error: (error) => {
        console.error("Error loading trips:", error);
        this.isLoading = false;
      },
    });
  }

  loadBookingRequests() {
    this.isLoading = true;
    this.bookingRequests = [];
    this.filteredTrips = [];

    this.tripsService.getPendingBookings().subscribe({
      next: (response) => {
        console.log("Booking requests loaded:", response);
        this.bookingRequests = response.data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error("Error loading booking requests:", error);
        this.isLoading = false;
      },
    });
  }

  filterTrips() {
    if (!this.trips || this.trips.length === 0) {
      this.filteredTrips = [];
      return;
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

    switch (this.activeSection) {
      case "active":
        // Published trips with at least one batch that hasn't ended yet
        this.filteredTrips = this.trips.filter(
          (trip) =>
            trip.status === "PUBLISHED" &&
            trip.batches.some(
              (batch) => new Date(batch.endDate) >= currentDate,
            ),
        );
        break;

      case "pending":
        // Pending approval trips
        this.filteredTrips = this.trips.filter(
          (trip) => trip.status === "PENDING_APPROVAL",
        );
        break;

      case "rejected":
        // Rejected trips
        this.filteredTrips = this.trips.filter(
          (trip) => trip.status === "REJECTED",
        );
        break;

      case "drafts":
        // Draft trips
        this.filteredTrips = this.trips.filter(
          (trip) => trip.status === "DRAFT",
        );
        break;

      case "past":
        // Published trips where ALL batches have ended (past current date)
        this.filteredTrips = this.trips.filter(
          (trip) =>
            trip.status === "PUBLISHED" &&
            trip.batches.length > 0 &&
            trip.batches.every(
              (batch) => new Date(batch.endDate) < currentDate,
            ),
        );
        break;

      default:
        // Show all trips for any other tab
        this.filteredTrips = this.trips;
    }

    console.log(
      `Filtered trips for ${this.activeSection}:`,
      this.filteredTrips,
    );
  }

  editMode(): void {
    this.router.navigate(["edit"], { relativeTo: this.route });
  }

  editTrip(tripId: string): void {
    this.router.navigate(["edit", tripId], { relativeTo: this.route });
  }

  deleteTrip(tripId: string): void {
    this.tripToDelete = tripId;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.tripToDelete = null;
  }

  confirmDelete(): void {
    if (!this.tripToDelete) return;

    this.tripsService.deleteTrip(this.tripToDelete).subscribe({
      next: () => {
        // Remove trip from both arrays
        this.trips = this.trips.filter((t) => t.id !== this.tripToDelete);
        this.filterTrips();
        this.showDeleteModal = false;
        this.tripToDelete = null;
        alert("Trip deleted successfully");
      },
      error: (error) => {
        console.error("Error deleting trip:", error);
        alert("Failed to delete trip. Please try again.");
        this.showDeleteModal = false;
        this.tripToDelete = null;
      },
    });
  }

  viewReason(tripId: string): void {
    this.tripsService.getTripModeration(tripId).subscribe({
      next: (response) => {
        if (response.data && response.data.length > 0) {
          // Get the most recent moderation entry
          const latestModeration = response.data[0];
          this.rejectionData = {
            reasons: latestModeration.reasons || [],
            adminMessage: latestModeration.admin_message || "",
          };
          this.showReasonModal = true;
        } else {
          alert("No rejection reason found");
        }
      },
      error: (error) => {
        console.error("Error loading rejection reason:", error);
        alert("Failed to load rejection reason");
      },
    });
  }

  closeReasonModal(): void {
    this.showReasonModal = false;
    this.rejectionData = null;
  }

  getDuration(batch: any): string {
    return `${batch.duration.nights}N/${batch.duration.days}D`;
  }

  getFirstBatch(trip: Trip) {
    return trip.batches[0];
  }
  formatCurrency(value: number): string {
    if (value === null || value === undefined || isNaN(value)) {
      return "0";
    }

    return new Intl.NumberFormat("en-IN").format(value);
  }

  bookingRejected(bookingId?: string) {
    this.bookingToReject = bookingId || null;
    this.showBookingRejectionModal = true;
  }

  cancelBookingRejection(): void {
    this.showBookingRejectionModal = false;
    this.bookingToReject = null;
  }

  confirmBookingRejection(): void {
    if (!this.bookingToReject) {
      this.showBookingRejectionModal = false;
      return;
    }

    const reason =
      "Unfortunately, we are unable to accommodate your request at this time.";

    this.tripsService.rejectBooking(this.bookingToReject, reason).subscribe({
      next: () => {
        alert("Booking request declined successfully");
        this.showBookingRejectionModal = false;
        this.bookingToReject = null;
        // Reload booking requests to update the list
        this.loadBookingRequests();
      },
      error: (error) => {
        console.error("Error declining booking:", error);
        alert("Failed to decline booking request. Please try again.");
        this.showBookingRejectionModal = false;
        this.bookingToReject = null;
      },
    });
  }

  bookingAccepted(bookingId?: string) {
    this.bookingToAccept = bookingId || null;
    this.showBookingAcceptanceModal = true;
  }

  cancelBookingAcceptance(): void {
    this.showBookingAcceptanceModal = false;
    this.bookingToAccept = null;
  }

  confirmBookingAcceptance(): void {
    if (!this.bookingToAccept) {
      this.showBookingAcceptanceModal = false;
      return;
    }

    this.tripsService.confirmBooking(this.bookingToAccept).subscribe({
      next: () => {
        alert("Booking request accepted successfully");
        this.showBookingAcceptanceModal = false;
        this.bookingToAccept = null;
        // Reload booking requests to update the list
        this.loadBookingRequests();
      },
      error: (error) => {
        console.error("Error accepting booking:", error);
        alert("Failed to accept booking request. Please try again.");
        this.showBookingAcceptanceModal = false;
        this.bookingToAccept = null;
      },
    });
  }
}
