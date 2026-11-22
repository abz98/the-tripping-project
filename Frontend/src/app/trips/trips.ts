import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { TripsService, Trip } from "../services/trips.service";

@Component({
  selector: "app-trips",
  standalone: false,
  templateUrl: "./trips.html",
  styleUrl: "./trips.css",
})
export class Trips implements OnInit {
  trips: Trip[] = [];
  loading: boolean = true;
  error: string = "";
  currentImageIndexMap: Map<string, number> = new Map();

  constructor(
    private router: Router,
    private tripsService: TripsService,
  ) {}

  ngOnInit() {
    this.loadTrips();
  }

  loadTrips() {
    this.loading = true;
    this.tripsService.getAllTrips().subscribe({
      next: (response) => {
        this.trips = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error("Error loading trips:", error);
        this.error = "Failed to load trips";
        this.loading = false;
      },
    });
  }

  viewTripDetails(tripId: string) {
    this.router.navigate(["/home/tripDetails", tripId]);
  }

  getFirstBatch(trip: Trip) {
    return trip.batches && trip.batches.length > 0 ? trip.batches[0] : null;
  }

  getAdditionalBatchesCount(trip: Trip): number {
    return trip.batches ? trip.batches.length - 1 : 0;
  }

  formatDate(dateString: string): string {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  getDuration(trip: Trip): string {
    const batch = this.getFirstBatch(trip);
    if (!batch) return "";
    return `${batch.duration.nights}N/${batch.duration.days}D`;
  }

  getAvailableSlots(trip: Trip): number {
    const batch = this.getFirstBatch(trip);
    return batch ? batch.availableSlots : 0;
  }

  getStartDate(trip: Trip): string {
    const batch = this.getFirstBatch(trip);
    return batch ? this.formatDate(batch.startDate) : "";
  }

  getFirstImage(trip: Trip): string {
    return trip.images && trip.images.length > 0
      ? trip.images[0]
      : "redtraveller.jpg";
  }

  isSuperHost(trip: Trip): boolean {
    // You can implement logic to determine super host status
    return false;
  }

  // Image navigation methods
  getCurrentImageIndex(trip: Trip): number {
    return this.currentImageIndexMap.get(trip.id) || 0;
  }

  getCurrentImage(trip: Trip): string {
    const index = this.getCurrentImageIndex(trip);
    return trip.images && trip.images.length > 0
      ? trip.images[index]
      : "redtraveller.jpg";
  }

  setCurrentImage(trip: Trip, index: number): void {
    this.currentImageIndexMap.set(trip.id, index);
  }

  nextImage(trip: Trip): void {
    if (!trip.images || trip.images.length === 0) return;
    const currentIndex = this.getCurrentImageIndex(trip);
    const nextIndex = (currentIndex + 1) % trip.images.length;
    this.setCurrentImage(trip, nextIndex);
  }

  previousImage(trip: Trip): void {
    if (!trip.images || trip.images.length === 0) return;
    const currentIndex = this.getCurrentImageIndex(trip);
    const prevIndex =
      currentIndex === 0 ? trip.images.length - 1 : currentIndex - 1;
    this.setCurrentImage(trip, prevIndex);
  }
}
