import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { TripsService } from "../services/trips.service";

@Component({
  selector: "app-trip-details",
  standalone: false,
  templateUrl: "./trip-details.html",
  styleUrl: "./trip-details.css",
})
export class TripDetails implements OnInit {
  showConfirmationModal = false;
  trip: any = null;
  relatedTrips: any[] = [];
  loading = false;
  error = false;
  tripId: string = "";
  currentImageIndex: number[] = [];
  selectedBatch: number = 0;
  selectedBatchId!: string;
  constructor(
    private route: ActivatedRoute,
    private tripsService: TripsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.tripId = params["tripId"];
      if (this.tripId) {
        this.loadTripDetails();
      }
    });
    this.cdr.detectChanges();
  }

  loadTripDetails() {
    this.loading = true;
    this.error = false;

    // Check if we're on host route or public route
    const isHostRoute = this.route.snapshot.url[0]?.path === "host";

    if (isHostRoute) {
      // Call host trips API
      this.tripsService.getHostTrips().subscribe({
        next: (response) => {
          if (response && response.data) {
            this.relatedTrips = response.data
              .filter((t: any) => t.id !== this.tripId)
              .slice(0, 4);
            this.trip = response.data.find((t: any) => t.id === this.tripId);
            this.loading = false;
            this.relatedTrips.forEach(() => {
              this.currentImageIndex.push(0);
            });
            if (this.trip?.batches?.length > 0) {
              this.selectedBatch = this.trip.batches[0].availableSlots;
              this.selectedBatchId = this.trip.batches[0].id;
            }
          }
        },
        error: (error) => {
          console.error("Error loading host trip details:", error);
          this.error = true;
          this.loading = false;
        },
      });
    } else {
      // Call public trips API (existing logic)
      this.tripsService.getAllTrips().subscribe({
        next: (response) => {
          if (response && response.data) {
            this.relatedTrips = response.data
              .filter((t: any) => t.id !== this.tripId)
              .slice(0, 4);
            this.trip = response.data.find((t: any) => t.id === this.tripId);
            this.loading = false;
            this.relatedTrips.forEach(() => {
              this.currentImageIndex.push(0);
            });
            if (this.trip?.batches?.length > 0) {
              this.selectedBatch = this.trip.batches[0].availableSlots;
              this.selectedBatchId = this.trip.batches[0].id;
            }
          }
        },
        error: (error) => {
          console.error("Error loading trip details:", error);
          this.error = true;
          this.loading = false;
        },
      });
    }
  }

  openConfirmationModal() {
    this.showConfirmationModal = true;
  }

  closeConfirmationModal() {
    this.showConfirmationModal = false;
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

  getFirstBatch(trip: any) {
    return trip?.batches && trip.batches.length > 0 ? trip.batches[0] : null;
  }

  getDuration(trip: any): string {
    const batch = this.getFirstBatch(trip);
    return batch ? `${batch.duration.nights}N/${batch.duration.days}D` : "N/A";
  }

  getAvailableSlots(trip: any): number {
    const batch = this.getFirstBatch(trip);
    return batch?.availableSlots || 0;
  }

  getStartDate(trip: any): string {
    const batch = this.getFirstBatch(trip);
    return batch ? this.formatDate(batch.startDate) : "";
  }

  getFirstImage(trip: any): string {
    return trip?.images && trip.images.length > 0
      ? trip.images[0]
      : "redtraveller.jpg";
  }

  viewTripDetails(tripId: string) {
    window.location.href = `/trip-details/${tripId}`;
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  nextImage(images: string[], index: number) {
    if (!images?.length) return;

    this.currentImageIndex[index] =
      (this.currentImageIndex[index] + 1) % images.length;
  }

  prevImage(images: string[], index: number) {
    if (!images?.length) return;

    this.currentImageIndex[index] =
      (this.currentImageIndex[index] - 1 + images.length) % images.length;
  }

  setImage(index: number) {
    this.currentImageIndex[index] = index;
  }
  getDestination(destination: string[]) {
    let str: string[] = [];
    destination.map((item) => {
      str.push(item.split(",")[0]);
    });
    return str.join(" - ");
  }
  formatCurrency(value: number): string {
    if (value === null || value === undefined || isNaN(value)) {
      return "0";
    }

    return new Intl.NumberFormat("en-IN").format(value);
  }
  batchSelected(batch: any) {
    this.selectedBatchId = batch.id;
    this.selectedBatch = batch.availableSlots;
  }

  handleTripRequest(formData: any) {
    delete formData.batchStartDate;
    const newFormData = { ...formData, tripId: this.tripId };
    console.log("Trip request received:", newFormData);
    // Here you can add API call to submit the request
    // Example:
    this.tripsService.submitTripRequest(formData).subscribe({
      next: (response) => {
        alert("Request submitted successfully");
        // Show success message
      },
      error: (error) => {
        alert("Error submitting request:");
        // Show error message
      },
    });
  }
}
