import { Component, Input, Output, EventEmitter } from "@angular/core";
import { TripsService, TripCreateData } from "../services/trips.service";

@Component({
  selector: "app-host-panel-trip-creation-confirmation",
  standalone: false,
  templateUrl: "./host-panel-trip-creation-confirmation.html",
  styleUrl: "./host-panel-trip-creation-confirmation.css",
})
export class HostPanelTripCreationConfirmation {
  editMode: boolean = false;
  @Input() tripData: TripCreateData | null = null;
  @Input() set isEditMode(value: boolean) {
    if (value) {
      this.editMode = value;
    }
  }
  @Output() close = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  isReasonExpanded = true;
  isSubmitting = false;
  responseMessage = "";

  constructor(private tripsService: TripsService) {}

  toggleReason() {
    this.isReasonExpanded = !this.isReasonExpanded;
  }

  closeModal() {
    this.close.emit();
  }

  submitTrip() {
    if (!this.tripData) {
      alert("No trip data available");
      return;
    }

    // Debug: Check if images are present
    console.log("Trip data images:", this.tripData.images);
    console.log(
      "Images details:",
      this.tripData.images.map((img) => ({
        name: img.name,
        size: img.size,
        type: img.type,
      })),
    );

    this.isSubmitting = true;

    console.log("Submitting trip data:", this.tripData);
    this.tripsService.createOrEditTrip(this.tripData).subscribe({
      next: (response) => {
        console.log("Trip created successfully:", response);
        this.isSubmitting = false;
        // alert("Trip created successfully!");
        this.submitted.emit();
      },
      error: (error) => {
        console.error("Error creating trip:", error);
        this.isSubmitting = false;
        // alert(
        //   "Error creating trip: " +
        //   (error.error?.message || "Please try again"),
        // );
      },
    });
  }

  get tripTitle(): string {
    return this.tripData?.title || "Trip";
  }

  get tripDestination(): string {
    return this.tripData?.destination?.[0] || "Destination";
  }
}
