import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { Router } from "@angular/router";
import { AdminService, AdminTrip } from "../../services/admin.service";
import { finalize } from "rxjs/operators";

interface Trip {
  id: string;
  name: string;
  hostName: string;
  hostAvatar: string;
  duration_days: string | number;
  destination: string;
  date: Date;
  participants: number;
  maxParticipants: number;
  duration_nights: string | number;
  status: string;
  price: number;
  selected?: boolean;
}

@Component({
  selector: "app-admin-trip-confirmation",
  standalone: false,
  templateUrl: "./admin-trip-confirmation.html",
  styleUrls: ["./admin-trip-confirmation.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTripConfirmation implements OnInit {
  trips: Trip[] = [];
  filteredTrips: Trip[] = [];
  paginatedTrips: Trip[] = [];

  searchTerm: string = "";
  pageSize: number = 8;
  currentPage: number = 1;
  activeDropdown: string | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  // Modal state
  showModal: boolean = false;
  modalType: "approve" | "reject" | null = null;
  selectedTripId: string | null = null;
  selectedReasons: string[] = [];
  adminMessage: string = "";

  // Predefined reasons
  approvalReasons = [
    "Complete documentation",
    "Verified host credentials",
    "Meets safety standards",
    "Appropriate pricing",
    "Clear itinerary",
  ];

  rejectionReasons = [
    "Incomplete documentation",
    "Safety concerns",
    "Inappropriate content",
    "Pricing issues",
    "Unclear itinerary",
    "Host verification failed",
    "Policy violations",
  ];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private adminService: AdminService,
  ) {}

  ngOnInit(): void {
    this.loadTrips();
  }

  loadTrips(): void {
    this.isLoading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.adminService
      .getPendingTrips()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (response) => {
          if (response.status === "success" && response.data) {
            this.trips = response.data.map((trip: AdminTrip) =>
              this.mapApiTripToTrip(trip),
            );
            this.filteredTrips = [...this.trips];
            this.updatePagination();
          }
        },
        error: (error: any) => {
          console.error("Error loading trips:", error);
          this.error = "Failed to load trips. Please try again.";
          this.trips = [];
          this.filteredTrips = [];
          this.paginatedTrips = [];
          this.cdr.markForCheck();
        },
      });
  }

  private mapApiTripToTrip(apiTrip: AdminTrip): Trip {
    return {
      id: apiTrip.id,
      name: apiTrip.tripName,
      hostName: apiTrip.hostDetails?.name || "Unknown Host",
      hostAvatar: apiTrip.hostDetails?.avatar || "/User.jpg",
      duration_nights: apiTrip.duration_nights || "1",
      duration_days: apiTrip.duration_days || "1",
      destination:
        apiTrip.destination && apiTrip.destination.length > 0
          ? apiTrip.destination[0]
          : "Not specified",
      date: new Date(apiTrip.createdAt),
      participants: 0,
      maxParticipants: 0,
      status: this.mapApiStatus(apiTrip.status),
      price: apiTrip.base_price,
      selected: false,
    };
  }

  private mapApiStatus(apiStatus: string): string {
    const statusMap: { [key: string]: string } = {
      PENDING_APPROVAL: "pending",
      APPROVED: "approved",
      REJECTED: "rejected",
      CANCELLED: "cancelled",
    };
    return statusMap[apiStatus] || apiStatus.toLowerCase();
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredTrips = [...this.trips];
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredTrips = this.trips.filter(
        (trip) =>
          trip.name.toLowerCase().includes(term) ||
          trip.hostName.toLowerCase().includes(term) ||
          trip.destination.toLowerCase().includes(term) ||
          trip.id.toLowerCase().includes(term),
      );
    }
    this.currentPage = 1;
    this.updatePagination();
    this.cdr.markForCheck();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
    this.cdr.markForCheck();
  }

  updatePagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedTrips = this.filteredTrips.slice(startIndex, endIndex);
    this.cdr.markForCheck();
  }

  goToPage(page: number): void {
    const totalPages = this.getTotalPages();
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredTrips.length / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= maxVisible; i++) {
          pages.push(i);
        }
      } else if (this.currentPage >= totalPages - 2) {
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages;
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    const end = this.currentPage * this.pageSize;
    return end > this.filteredTrips.length ? this.filteredTrips.length : end;
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    this.paginatedTrips.forEach((trip) => (trip.selected = checked));
    this.cdr.markForCheck();
  }

  toggleDropdown(tripId: string): void {
    this.activeDropdown = this.activeDropdown === tripId ? null : tripId;
    this.cdr.markForCheck();
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: "bg-warning",
      approved: "bg-success",
      rejected: "bg-danger",
      cancelled: "bg-secondary",
    };
    return statusMap[status.toLowerCase()] || "bg-secondary";
  }

  approveTrip(tripId: string): void {
    this.activeDropdown = null;
    this.selectedTripId = tripId;
    this.modalType = "approve";
    this.showModal = true;
    this.selectedReasons = [];
    this.adminMessage = "";
    this.cdr.markForCheck();
  }

  rejectTrip(tripId: string): void {
    this.activeDropdown = null;
    this.selectedTripId = tripId;
    this.modalType = "reject";
    this.showModal = true;
    this.selectedReasons = [];
    this.adminMessage = "";
    this.cdr.markForCheck();
  }

  closeModal(): void {
    this.showModal = false;
    this.modalType = null;
    this.selectedTripId = null;
    this.selectedReasons = [];
    this.adminMessage = "";
    this.cdr.markForCheck();
  }

  toggleReason(reason: string): void {
    const index = this.selectedReasons.indexOf(reason);
    if (index > -1) {
      this.selectedReasons.splice(index, 1);
    } else {
      this.selectedReasons.push(reason);
    }
    this.cdr.markForCheck();
  }

  isReasonSelected(reason: string): boolean {
    return this.selectedReasons.includes(reason);
  }

  submitApprovalDecision(): void {
    if (!this.selectedTripId) return;

    // Prepare reasons array and admin message
    const reasons = [...this.selectedReasons];
    const adminMsg = this.adminMessage.trim() || undefined;

    if (this.modalType === "approve") {
      this.adminService
        .approveTrip(this.selectedTripId, reasons, adminMsg)
        .subscribe({
          next: () => {
            const trip = this.trips.find((t) => t.id === this.selectedTripId);
            if (trip) {
              trip.status = "approved";
              this.updatePagination();
            }
            this.closeModal();
            console.log("Trip approved successfully:", this.selectedTripId);
          },
          error: (error: any) => {
            console.error("Error approving trip:", error);
            alert("Failed to approve trip. Please try again.");
            this.cdr.markForCheck();
          },
        });
    } else if (this.modalType === "reject") {
      this.adminService
        .rejectTrip(this.selectedTripId, reasons, adminMsg)
        .subscribe({
          next: () => {
            const trip = this.trips.find((t) => t.id === this.selectedTripId);
            if (trip) {
              trip.status = "rejected";
              this.updatePagination();
            }
            this.closeModal();
            console.log("Trip rejected successfully:", this.selectedTripId);
          },
          error: (error: any) => {
            console.error("Error rejecting trip:", error);
            alert("Failed to reject trip. Please try again.");
            this.cdr.markForCheck();
          },
        });
    }
  }

  viewDetails(tripId: string): void {
    this.activeDropdown = null;
    this.cdr.markForCheck();
    this.router.navigate(["/admin/trips", tripId]);
  }

  deleteTrip(tripId: string): void {
    if (
      confirm(
        "Are you sure you want to delete this trip? This action cannot be undone.",
      )
    ) {
      this.activeDropdown = null;
      this.cdr.markForCheck();

      this.adminService.deleteTrip(tripId).subscribe({
        next: () => {
          this.trips = this.trips.filter((t) => t.id !== tripId);
          this.filteredTrips = this.filteredTrips.filter(
            (t) => t.id !== tripId,
          );
          this.updatePagination();
          console.log("Trip deleted successfully:", tripId);
        },
        error: (error: any) => {
          console.error("Error deleting trip:", error);
          alert("Failed to delete trip. Please try again.");
        },
      });
    } else {
      this.activeDropdown = null;
      this.cdr.markForCheck();
    }
  }
  formatCurrency(value: number): string {
    if (value === null || value === undefined || isNaN(value)) {
      return "0";
    }

    return new Intl.NumberFormat("en-IN").format(value);
  }
}
