import { Component, Output, EventEmitter, Input } from "@angular/core";

interface TripRequestForm {
  batchId: string;
  batchStartDate: string;
  pickupLocation: string;
  slots: number;
  message: string;
  tripId?: string;
}

@Component({
  selector: "app-trip-details-confirmation",
  standalone: false,
  templateUrl: "./trip-details-confirmation.html",
  styleUrls: ["./trip-details-confirmation.css"],
})
export class TripDetailsConfirmation {
  @Output() close = new EventEmitter<void>();
  @Output() submitRequest = new EventEmitter<TripRequestForm>();

  @Input() set tripDetails(value: any) {
    if (value && Object.keys(value).length > 0) {
      this.tripData = value;
      if (value.batches && value.batches.length > 0) {
        this.selectedBatch = value.batches.filter(
          (i: any) => i.id == value.selectedBatch,
        )[0];
        this.formData.batchId = value.batches[0].id;
        this.formData.batchStartDate = value.batches[0].startDate;
      }
      if (
        value.route &&
        value.route.pickupLocations &&
        value.route.pickupLocations.length > 0
      ) {
        this.selectedPickup = value.route.pickupLocations[0];
        this.formData.pickupLocation = value.route.pickupLocations[0];
      }
    }
  }

  tripData: any = null;
  currentStep = 1;

  // Form data object
  formData: TripRequestForm = {
    batchId: "",
    batchStartDate: "",
    pickupLocation: "",
    slots: 1,
    message: "",
  };

  // Dropdown states
  batchDropdownOpen = false;
  pickupDropdownOpen = false;
  selectedBatch: any = null;
  selectedPickup: string = "";

  closeModal() {
    this.close.emit();
  }

  nextStep() {
    if (this.currentStep < 4) {
      this.currentStep++;
    }
  }

  incrementSlots(slotLimit: number) {
    if (this.formData.slots < slotLimit) {
      this.formData.slots++;
    }
  }

  decrementSlots() {
    if (this.formData.slots > 1) {
      this.formData.slots--;
    }
  }

  toggleBatchDropdown() {
    this.batchDropdownOpen = !this.batchDropdownOpen;
    if (this.batchDropdownOpen) {
      this.pickupDropdownOpen = false;
    }
  }

  togglePickupDropdown() {
    this.pickupDropdownOpen = !this.pickupDropdownOpen;
    if (this.pickupDropdownOpen) {
      this.batchDropdownOpen = false;
    }
  }

  selectBatch(batch: any) {
    this.selectedBatch = batch;
    this.formData.slots = 1;
    this.formData.batchId = batch.id;
    this.formData.batchStartDate = batch.startDate;
    this.batchDropdownOpen = false;
  }

  selectPickup(location: string) {
    this.selectedPickup = location;
    this.formData.pickupLocation = location;
    this.pickupDropdownOpen = false;
  }

  onMessageInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.formData.message = textarea.value;
  }

  getCharCount(): number {
    return this.formData.message.length;
  }

  isFormValid(): boolean {
    return !!(
      this.formData.batchId &&
      this.formData.pickupLocation &&
      this.formData.slots > 0 &&
      this.formData.message.trim().length > 0 &&
      this.formData.message.length <= 500
    );
  }

  submitForm() {
    if (this.isFormValid()) {
      console.log("Form submitted:", this.formData);
      this.submitRequest.emit(this.formData);
      this.closeModal();
    } else {
      alert("Please fill in all required fields");
    }
  }

  formatBatchDate(dateStr: string): string {
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
}
