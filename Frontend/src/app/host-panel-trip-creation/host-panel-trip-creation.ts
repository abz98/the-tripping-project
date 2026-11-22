import { Component, OnInit, HostListener } from "@angular/core";
import { FormArray, FormBuilder, FormGroup } from "@angular/forms";
import { CitiesService, City } from "../services/cities.service";
import { CategoriesService, Category } from "../services/categories.service";
import { TripsService, Trip } from "../services/trips.service";
import { debounceTime, distinctUntilChanged, Subject } from "rxjs";
import { Router, ActivatedRoute } from "@angular/router";

interface Batch {
  startDate: Date | null;
  endDate: Date | null;
  totalSlots: number;
  showDatePicker: boolean;
  currentMonth: Date;
  hoverDate: Date | null;
}

@Component({
  selector: "app-host-panel-trip-creation",
  standalone: false,
  templateUrl: "./host-panel-trip-creation.html",
  styleUrl: "./host-panel-trip-creation.css",
})
export class HostPanelTripCreation implements OnInit {
  // Modal state
  isModalOpen = false;

  // Edit mode
  isEditMode = false;
  tripId: string | null = null;
  loadingTripData = false;

  // Form Fields
  tripTitle: string = "";
  pricePerPerson: number = 0;
  aboutTrip: string = "";
  additionalMessage: string = "";

  // Cancellation dropdown
  isDropdownOpen = false;
  selectedCancellation = {
    value: "FREE" as "FREE" | "PARTIAL" | "NONE",
    title: "Days Free Cancellation",
    desc: 'Cancellations allowed up to "Number" days before the host confirms final travellers.',
  };

  cancellationOptions = [
    {
      value: "FREE" as "FREE" | "PARTIAL" | "NONE",
      title: "Days Free Cancellation",
      desc: 'Cancellations allowed up to "Number" days before the host confirms final travellers.',
    },
    {
      value: "PARTIAL" as "FREE" | "PARTIAL" | "NONE",
      title: "Flexible Cancellation",
      desc: "Cancel anytime before the trip starts and get a refund.",
    },
    {
      value: "NONE" as "FREE" | "PARTIAL" | "NONE",
      title: "No Cancellation",
      desc: "This trip is non-refundable once booked.",
    },
  ];

  // City search
  searchQuery = "";
  searchResults: City[] = [];
  selectedCities: City[] = [];
  isSearching = false;
  showSearchDropdown = false;
  private searchSubject = new Subject<string>();

  // Start Location
  startLocationQuery = "";
  startLocationResults: City[] = [];
  selectedStartLocation: City | null = null;
  isSearchingStartLocation = false;
  showStartLocationDropdown = false;
  private startLocationSearchSubject = new Subject<string>();

  // End Location
  endLocationQuery = "";
  endLocationResults: City[] = [];
  selectedEndLocation: City | null = null;
  isSearchingEndLocation = false;
  showEndLocationDropdown = false;
  private endLocationSearchSubject = new Subject<string>();

  // Pickup Locations
  pickupLocationQuery = "";
  pickupLocationResults: City[] = [];
  selectedPickupLocations: City[] = [];
  isSearchingPickupLocation = false;
  showPickupLocationDropdown = false;
  private pickupLocationSearchSubject = new Subject<string>();

  // Trip Type Tags
  tripTypeTagInput = "";
  tripTypeTags: string[] = [];

  // Categories
  categories: Category[] = [];
  selectedCategoryId = "";
  selectedCategories: Category[] = [];
  showCategoryDropdown = false;

  // Batches FormArray
  batches: Batch[] = [];

  // Trip Images
  tripImages: File[] = [];
  tripImagePreviews: string[] = [];

  // Cancellation Days
  customDays: number = 2;
  selectedDays: number[] = [];
  predefinedDays: number[] = [2, 5, 7];

  // Group categories by type
  get groupedCategories() {
    const grouped: { [key: string]: Category[] } = {};
    this.categories.forEach((cat) => {
      if (!grouped[cat.type]) {
        grouped[cat.type] = [];
      }
      grouped[cat.type].push(cat);
    });
    return grouped;
  }

  constructor(
    private citiesService: CitiesService,
    private categoriesService: CategoriesService,
    private fb: FormBuilder,
    private tripsService: TripsService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    // Setup debounced search for destinations
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        if (query.length >= 2) {
          this.searchCities(query);
        } else {
          this.searchResults = [];
          this.showSearchDropdown = false;
        }
      });

    // Setup debounced search for start location
    this.startLocationSearchSubject
      .pipe(debounceTime(100), distinctUntilChanged())
      .subscribe((query) => {
        if (query.length >= 2) {
          this.searchStartLocation(query);
        } else {
          this.startLocationResults = [];
          this.showStartLocationDropdown = false;
        }
      });

    // Setup debounced search for end location
    this.endLocationSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        if (query.length >= 2) {
          this.searchEndLocation(query);
        } else {
          this.endLocationResults = [];
          this.showEndLocationDropdown = false;
        }
      });

    // Setup debounced search for pickup locations
    this.pickupLocationSearchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => {
        if (query.length >= 2) {
          this.searchPickupLocation(query);
        } else {
          this.pickupLocationResults = [];
          this.showPickupLocationDropdown = false;
        }
      });
  }

  ngOnInit() {
    this.loadCategories();

    // Check if we're in edit mode
    this.route.params.subscribe((params) => {
      this.tripId = params["tripId"];
      if (this.tripId) {
        this.isEditMode = true;
        this.loadTripData(this.tripId);
      } else {
        // Initialize with one batch for create mode
        this.addBatch();
      }
    });
  }

  loadTripData(tripId: string) {
    this.loadingTripData = true;

    this.tripsService.getHostTrips().subscribe({
      next: (response) => {
        const trip = response.data.find((t: Trip) => t.id === tripId);

        if (trip) {
          this.populateFormWithTripData(trip);
        } else {
          alert("Trip not found");
          this.router.navigate(["/host"]);
        }

        this.loadingTripData = false;
      },
      error: (error) => {
        console.error("Error loading trip data:", error);
        alert("Failed to load trip data");
        this.loadingTripData = false;
        this.router.navigate(["/host"]);
      },
    });
  }

  populateFormWithTripData(trip: Trip) {
    // Basic fields
    this.tripTitle = trip.title;
    this.pricePerPerson = trip.pricePerPerson;
    this.aboutTrip = trip.aboutTrip;
    this.additionalMessage = trip.additionalMessage || "";

    // Categories
    this.selectedCategories = this.categories.filter((cat) =>
      trip.categoryId.includes(cat.id),
    );

    // Destinations - parse city strings back to City objects
    this.selectedCities = trip.destination.map((dest) => {
      const [city, state] = dest.split(", ");
      return { City: city, State: state } as City;
    });

    // Start Location
    if (trip.route.startLocation) {
      const [city, state] = trip.route.startLocation.split(", ");
      this.selectedStartLocation = { City: city, State: state } as City;
      this.startLocationQuery = trip.route.startLocation;
    }

    // End Location
    if (trip.route.endLocation) {
      const [city, state] = trip.route.endLocation.split(", ");
      this.selectedEndLocation = { City: city, State: state } as City;
      this.endLocationQuery = trip.route.endLocation;
    }

    // Pickup Locations
    this.selectedPickupLocations = trip.route.pickupLocations.map((loc) => {
      const [city, state] = loc.split(", ");
      return { City: city, State: state } as City;
    });

    // Tags
    this.tripTypeTags = [...trip.tags];

    // Batches
    this.batches = trip.batches.map((batch) => ({
      startDate: new Date(batch.startDate),
      endDate: new Date(batch.endDate),
      totalSlots: batch.totalSlots,
      showDatePicker: false,
      currentMonth: new Date(batch.startDate),
      hoverDate: null,
    }));

    // Cancellation Policy
    const policyOption = this.cancellationOptions.find(
      (opt) => opt.value === trip.cancellationPolicy.type,
    );
    if (policyOption) {
      this.selectedCancellation = policyOption;
    }

    if (
      trip.cancellationPolicy.type === "FREE" &&
      trip.cancellationPolicy.freeCancellationDay
    ) {
      this.customDays = trip.cancellationPolicy.freeCancellationDay;
    }

    // Images - convert URLs to preview (we can't convert back to File objects)
    this.tripImagePreviews = [...trip.images];
    // Note: tripImages array will be empty since we can't convert URLs back to Files
    // The submit logic will need to handle this case
  }

  loadCategories() {
    this.categoriesService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.data;
      },
      error: (error) => {
        console.error("Error loading categories:", error);
      },
    });
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectOption(option: {
    value: "FREE" | "PARTIAL" | "NONE";
    title: string;
    desc: string;
  }) {
    this.selectedCancellation = option;
    this.isDropdownOpen = false;
  }

  openModal() {
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    this.searchSubject.next(this.searchQuery);
  }

  searchCities(query: string) {
    this.isSearching = true;
    this.citiesService.searchCities(query, 1, 10).subscribe({
      next: (response) => {
        this.searchResults = response.data;
        this.showSearchDropdown = this.searchResults.length > 0;
        this.isSearching = false;
      },
      error: (error) => {
        console.error("Error searching cities:", error);
        this.isSearching = false;
        this.searchResults = [];
        this.showSearchDropdown = false;
      },
    });
  }

  selectCity(city: City) {
    // Check if city is not already selected
    const exists = this.selectedCities.some(
      (c) => c.City === city.City && c.State === city.State,
    );

    if (!exists) {
      this.selectedCities.push(city);
    }

    // Clear search
    this.searchQuery = "";
    this.searchResults = [];
    this.showSearchDropdown = false;
  }

  removeCity(index: number) {
    this.selectedCities.splice(index, 1);
  }

  toggleSearchDropdown() {
    this.showSearchDropdown = !this.showSearchDropdown;
    if (this.showSearchDropdown && this.searchQuery.length >= 2) {
      this.searchCities(this.searchQuery);
    }
  }

  // Start Location methods
  onStartLocationInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.startLocationQuery = input.value;
    this.startLocationSearchSubject.next(this.startLocationQuery);
  }

  searchStartLocation(query: string) {
    this.isSearchingStartLocation = true;
    this.citiesService.searchCities(query, 1, 10).subscribe({
      next: (response) => {
        this.startLocationResults = response.data;
        this.showStartLocationDropdown = this.startLocationResults.length > 0;
        this.isSearchingStartLocation = false;
      },
      error: (error) => {
        console.error("Error searching start location:", error);
        this.isSearchingStartLocation = false;
        this.startLocationResults = [];
        this.showStartLocationDropdown = false;
      },
    });
  }

  selectStartLocation(city: City) {
    this.selectedStartLocation = city;
    this.startLocationQuery = `${city.City}, ${city.State}`;
    this.startLocationResults = [];
    this.showStartLocationDropdown = false;
  }

  clearStartLocation() {
    this.selectedStartLocation = null;
    this.startLocationQuery = "";
  }

  // End Location methods
  onEndLocationInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.endLocationQuery = input.value;
    this.endLocationSearchSubject.next(this.endLocationQuery);
  }

  searchEndLocation(query: string) {
    this.isSearchingEndLocation = true;
    this.citiesService.searchCities(query, 1, 10).subscribe({
      next: (response) => {
        this.endLocationResults = response.data;
        this.showEndLocationDropdown = this.endLocationResults.length > 0;
        this.isSearchingEndLocation = false;
      },
      error: (error) => {
        console.error("Error searching end location:", error);
        this.isSearchingEndLocation = false;
        this.endLocationResults = [];
        this.showEndLocationDropdown = false;
      },
    });
  }

  selectEndLocation(city: City) {
    this.selectedEndLocation = city;
    this.endLocationQuery = `${city.City}, ${city.State}`;
    this.endLocationResults = [];
    this.showEndLocationDropdown = false;
  }

  clearEndLocation() {
    this.selectedEndLocation = null;
    this.endLocationQuery = "";
  }

  // Pickup Locations methods
  onPickupLocationInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.pickupLocationQuery = input.value;
    this.pickupLocationSearchSubject.next(this.pickupLocationQuery);
  }

  searchPickupLocation(query: string) {
    this.isSearchingPickupLocation = true;
    this.citiesService.searchCities(query, 1, 10).subscribe({
      next: (response) => {
        this.pickupLocationResults = response.data;
        this.showPickupLocationDropdown = this.pickupLocationResults.length > 0;
        this.isSearchingPickupLocation = false;
      },
      error: (error) => {
        console.error("Error searching pickup location:", error);
        this.isSearchingPickupLocation = false;
        this.pickupLocationResults = [];
        this.showPickupLocationDropdown = false;
      },
    });
  }

  selectPickupLocation(city: City) {
    const exists = this.selectedPickupLocations.some(
      (c) => c.City === city.City && c.State === city.State,
    );

    if (!exists) {
      this.selectedPickupLocations.push(city);
    }

    this.pickupLocationQuery = "";
    this.pickupLocationResults = [];
    this.showPickupLocationDropdown = false;
  }

  removePickupLocation(index: number) {
    this.selectedPickupLocations.splice(index, 1);
  }

  // Trip Type Tags methods
  onTripTypeTagKeyPress(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      this.addTripTypeTag();
    }
  }

  addTripTypeTag() {
    const tag = this.tripTypeTagInput.trim();
    if (tag && !this.tripTypeTags.includes(tag)) {
      this.tripTypeTags.push(tag);
      this.tripTypeTagInput = "";
    }
  }

  removeTripTypeTag(index: number) {
    this.tripTypeTags.splice(index, 1);
  }

  // Category multiselect methods
  toggleCategoryDropdown() {
    this.showCategoryDropdown = !this.showCategoryDropdown;
  }

  isCategorySelected(category: Category): boolean {
    return this.selectedCategories.some((c) => c.id === category.id);
  }

  toggleCategorySelection(category: Category) {
    const index = this.selectedCategories.findIndex(
      (c) => c.id === category.id,
    );
    if (index > -1) {
      this.selectedCategories.splice(index, 1);
    } else {
      this.selectedCategories.push(category);
    }
  }

  removeCategory(index: number) {
    this.selectedCategories.splice(index, 1);
  }

  // Click outside handler to close all dropdowns
  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    // Close all dropdowns when clicking outside
    this.showCategoryDropdown = false;
    this.showSearchDropdown = false;
    this.showStartLocationDropdown = false;
    this.showEndLocationDropdown = false;
    this.showPickupLocationDropdown = false;
    this.isDropdownOpen = false;
    // Close all batch date pickers
    this.batches.forEach((batch) => (batch.showDatePicker = false));
  }

  // Batch Management Methods
  addBatch() {
    const newBatch: Batch = {
      startDate: null,
      endDate: null,
      totalSlots: 20,
      showDatePicker: false,
      currentMonth: new Date(),
      hoverDate: null,
    };
    this.batches.push(newBatch);
  }

  removeBatch(index: number) {
    if (this.batches.length > 1) {
      this.batches.splice(index, 1);
    }
  }

  // Date Picker Methods
  toggleDatePicker(batchIndex: number) {
    this.batches[batchIndex].showDatePicker =
      !this.batches[batchIndex].showDatePicker;
  }

  get monthName() {
    return this.batches[0]?.currentMonth.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  getMonthName(batchIndex: number) {
    return this.batches[batchIndex]?.currentMonth.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  get daysInMonth() {
    return this.getDaysInMonth(0);
  }

  getDaysInMonth(batchIndex: number) {
    const batch = this.batches[batchIndex];
    if (!batch) return [];

    const year = batch.currentMonth.getFullYear();
    const month = batch.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Adjust for Monday start (0 = Sunday, 1 = Monday, etc.)
    const adjustedStartDay =
      startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < adjustedStartDay; i++) {
      const prevMonthDay = new Date(year, month, -adjustedStartDay + i + 1);
      days.push(prevMonthDay);
    }

    // Add all days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    // Fill remaining slots to complete the grid
    const remainingSlots = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingSlots; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  }

  previousMonth(batchIndex: number) {
    const batch = this.batches[batchIndex];
    if (batch) {
      batch.currentMonth = new Date(
        batch.currentMonth.getFullYear(),
        batch.currentMonth.getMonth() - 1,
        1,
      );
    }
  }

  nextMonth(batchIndex: number) {
    const batch = this.batches[batchIndex];
    if (batch) {
      batch.currentMonth = new Date(
        batch.currentMonth.getFullYear(),
        batch.currentMonth.getMonth() + 1,
        1,
      );
    }
  }

  selectDate(date: Date | null, batchIndex: number) {
    if (!date) return;

    const batch = this.batches[batchIndex];
    if (!batch) return;

    // Check if date is in the past
    if (this.isPastDate(date)) return;

    // Normalize date to midnight for proper comparison
    const normalizedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );

    if (!batch.startDate || (batch.startDate && batch.endDate)) {
      // Start new selection
      batch.startDate = normalizedDate;
      batch.endDate = null;
      batch.hoverDate = null;
    } else if (normalizedDate < batch.startDate) {
      // If selected date is before start date, make it the new start date
      batch.startDate = normalizedDate;
      batch.endDate = null;
      batch.hoverDate = null;
    } else {
      // Set as end date
      batch.endDate = normalizedDate;
      batch.hoverDate = null;
      // Optionally close the date picker after selecting end date
      // batch.showDatePicker = false;
    }
  }

  isDateInRange(date: Date | null, batchIndex: number): boolean {
    if (!date) return false;
    const batch = this.batches[batchIndex];
    if (!batch || !batch.startDate) return false;

    const normalizedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const endDate = batch.endDate || batch.hoverDate;
    if (!endDate) return false;

    const normalizedEndDate = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
    );
    const normalizedStartDate = new Date(
      batch.startDate.getFullYear(),
      batch.startDate.getMonth(),
      batch.startDate.getDate(),
    );

    return (
      normalizedDate > normalizedStartDate && normalizedDate < normalizedEndDate
    );
  }

  isStartDate(date: Date | null, batchIndex: number): boolean {
    if (!date) return false;
    const batch = this.batches[batchIndex];
    if (!batch || !batch.startDate) return false;
    const normalizedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const normalizedStartDate = new Date(
      batch.startDate.getFullYear(),
      batch.startDate.getMonth(),
      batch.startDate.getDate(),
    );
    return normalizedDate.getTime() === normalizedStartDate.getTime();
  }

  isEndDate(date: Date | null, batchIndex: number): boolean {
    if (!date) return false;
    const batch = this.batches[batchIndex];
    if (!batch || !batch.endDate) return false;
    const normalizedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const normalizedEndDate = new Date(
      batch.endDate.getFullYear(),
      batch.endDate.getMonth(),
      batch.endDate.getDate(),
    );
    return normalizedDate.getTime() === normalizedEndDate.getTime();
  }

  isCurrentMonth(date: Date | null, batchIndex: number): boolean {
    if (!date) return false;
    const batch = this.batches[batchIndex];
    if (!batch) return false;
    return (
      date.getMonth() === batch.currentMonth.getMonth() &&
      date.getFullYear() === batch.currentMonth.getFullYear()
    );
  }

  isPastDate(date: Date | null): boolean {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const normalizedDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    return normalizedDate < today;
  }

  onDateHover(date: Date | null, batchIndex: number) {
    const batch = this.batches[batchIndex];
    if (!batch || !date || this.isPastDate(date)) {
      return;
    }

    if (batch.startDate && !batch.endDate) {
      const normalizedDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
      const normalizedStartDate = new Date(
        batch.startDate.getFullYear(),
        batch.startDate.getMonth(),
        batch.startDate.getDate(),
      );

      // Only set hover date if it's after or equal to the start date
      if (normalizedDate >= normalizedStartDate) {
        batch.hoverDate = normalizedDate;
      } else {
        batch.hoverDate = null;
      }
    }
  }

  onDateLeave(batchIndex: number) {
    // Clear hover date when mouse leaves
    const batch = this.batches[batchIndex];
    if (batch) {
      batch.hoverDate = null;
    }
  }

  getFormattedDateRange(batchIndex: number): string {
    const batch = this.batches[batchIndex];
    if (!batch || !batch.startDate) return "Select Date Range";

    const startStr = batch.startDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });

    if (!batch.endDate) return startStr;

    const endStr = batch.endDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });

    return `${startStr} -/- ${endStr}`;
  }

  get formattedDateRange(): string {
    return this.getFormattedDateRange(0);
  }

  getTripDuration(batchIndex: number): string {
    const batch = this.batches[batchIndex];
    if (!batch || !batch.startDate || !batch.endDate) {
      return "Auto Calculate";
    }

    const diffTime = Math.abs(
      batch.endDate.getTime() - batch.startDate.getTime(),
    );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const nights = diffDays;
    const days = diffDays + 1;

    return `${nights}N/${days}D`;
  }

  get tripDuration(): string {
    return this.getTripDuration(0);
  }

  // Image Upload Methods
  onImageSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const files = Array.from(input.files);
      files.forEach((file) => {
        if (file.type.startsWith("image/")) {
          this.tripImages.push(file);

          // Create preview
          const reader = new FileReader();
          reader.onload = (e: ProgressEvent<FileReader>) => {
            if (e.target?.result) {
              this.tripImagePreviews.push(e.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
    // Reset input
    input.value = "";
  }

  removeImage(index: number) {
    this.tripImages.splice(index, 1);
    this.tripImagePreviews.splice(index, 1);
  }

  get visibleImages() {
    return this.tripImagePreviews.slice(0, 3);
  }

  get remainingImagesCount() {
    return this.tripImages.length > 3 ? this.tripImages.length - 3 : 0;
  }

  // Cancellation Days Methods
  addCustomDays() {
    if (this.customDays && this.customDays > 0) {
      if (!this.selectedDays.includes(this.customDays)) {
        this.selectedDays.push(this.customDays);
        this.selectedDays.sort((a, b) => a - b);
      }
    }
  }

  selectDayTag(days: number) {
    // Single select - update the input field value
    this.customDays = days;
  }

  isDaySelected(days: number): boolean {
    return this.customDays === days;
  }

  removeSelectedDay(days: number) {
    const index = this.selectedDays.indexOf(days);
    if (index > -1) {
      this.selectedDays.splice(index, 1);
    }
  }

  // Modal state for confirmation
  isConfirmationModalOpen = false;
  preparedTripData: any = null;

  // Submit Trip - Validate and open confirmation modal
  submitTrip() {
    // Validate all required fields
    const validationErrors: string[] = [];

    if (!this.tripTitle || this.tripTitle.trim() === "") {
      validationErrors.push("Trip Title is required");
    }

    if (this.selectedCategories.length === 0) {
      validationErrors.push("At least one Category must be selected");
    }

    if (this.selectedCities.length === 0) {
      validationErrors.push("At least one Trip Destination must be selected");
    }

    if (!this.pricePerPerson || this.pricePerPerson <= 0) {
      validationErrors.push("Price Per Person must be greater than 0");
    }

    if (!this.selectedStartLocation) {
      validationErrors.push("Start Location is required");
    }

    if (!this.selectedEndLocation) {
      validationErrors.push("End Location is required");
    }

    if (this.selectedPickupLocations.length === 0) {
      validationErrors.push("At least one Pickup Location must be added");
    }

    if (this.tripTypeTags.length === 0) {
      validationErrors.push("At least one Trip Type Tag must be added");
    }

    // Validate batches
    if (this.batches.length === 0) {
      validationErrors.push("At least one Batch must be created");
    } else {
      this.batches.forEach((batch, index) => {
        if (!batch.startDate) {
          validationErrors.push(`Batch ${index + 1}: Start Date is required`);
        }
        if (!batch.endDate) {
          validationErrors.push(`Batch ${index + 1}: End Date is required`);
        }
        if (!batch.totalSlots || batch.totalSlots <= 0) {
          validationErrors.push(
            `Batch ${index + 1}: Total Slots must be greater than 0`,
          );
        }
      });
    }

    if (!this.aboutTrip || this.aboutTrip.trim() === "") {
      validationErrors.push("About Trip description is required");
    }

    // Show validation errors if any
    if (validationErrors.length > 0) {
      alert(
        "Please fix the following errors:\n\n" + validationErrors.join("\n"),
      );
      return;
    }

    // Prepare trip data once and store it
    this.preparedTripData = {
      title: this.tripTitle.trim(),
      categoryId: this.selectedCategories.map((cat) => cat.id),
      destination: this.selectedCities.map(
        (city) => `${city.City}, ${city.State}`,
      ),
      pricePerPerson: this.pricePerPerson,
      route: {
        startLocation: this.selectedStartLocation
          ? `${this.selectedStartLocation.City}, ${this.selectedStartLocation.State}`
          : "",
        endLocation: this.selectedEndLocation
          ? `${this.selectedEndLocation.City}, ${this.selectedEndLocation.State}`
          : "",
        pickupLocations: this.selectedPickupLocations.map(
          (loc) => `${loc.City}, ${loc.State}`,
        ),
      },
      tags: this.tripTypeTags,
      batches: this.batches.map((batch) => ({
        startDate: batch.startDate
          ? batch.startDate.toISOString().split("T")[0]
          : "",
        endDate: batch.endDate ? batch.endDate.toISOString().split("T")[0] : "",
        duration: this.calculateDuration(batch.startDate, batch.endDate),
        totalSlots: batch.totalSlots,
      })),
      images: this.tripImages, // Pass File objects
      aboutTrip: this.aboutTrip.trim(),
      cancellationPolicy: {
        type: this.selectedCancellation.value,
        ...(this.selectedCancellation.value === "FREE" && {
          freeCancellationDay: this.customDays,
        }),
      },
      additionalMessage: this.additionalMessage.trim(),
      status: "PENDING_APPROVAL" as const,
    };

    console.log("Prepared trip data with images:", {
      ...this.preparedTripData,
      images: this.preparedTripData.images.map((f: File) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    });

    // Open confirmation modal
    this.isConfirmationModalOpen = true;
  }

  // Get trip data for submission
  getTripData() {
    return this.isEditMode
      ? { ...this.preparedTripData, tripId: this.tripId }
      : this.preparedTripData;
  }

  closeConfirmationModal() {
    this.isConfirmationModalOpen = false;
  }

  onTripSubmitted() {
    this.isConfirmationModalOpen = false;
    // Navigate to host panel
    this.router.navigate(["/host"]);
  }

  private calculateDuration(
    startDate: Date | null,
    endDate: Date | null,
  ): { nights: number; days: number } {
    if (!startDate || !endDate) {
      return { nights: 0, days: 0 };
    }

    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const nights = diffDays;
    const days = diffDays + 1;

    return { nights, days };
  }
}
