import {
  Component,
  EventEmitter,
  HostListener,
  OnInit,
  Output,
} from "@angular/core";
import { CitiesService, City } from "../services/cities.service";
import { SearchService } from "../services/search.service";
import { Subject } from "rxjs";
import { debounceTime, distinctUntilChanged, switchMap } from "rxjs/operators";
import { Router, ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-search-bar",
  standalone: false,
  templateUrl: "./search-bar.html",
  styleUrl: "./search-bar.css",
})
export class SearchBar implements OnInit {
  showDestinationDropdown = false;
  showDateDropdown = false;
  showTravellersDropdown = false;
  dateMode: "exact" | "flexible" = "exact";
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  selectedSlot = 1;
  customSlots = 4;
  selectedDate: Date | null = null;

  // Search functionality
  searchQuery = "";
  destinations: City[] = [];
  isSearching = false;
  private searchSubject = new Subject<string>();

  monthNames = [
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

  calendarDays: any[] = [];

  constructor(
    private searchService: SearchService,
    private citiesService: CitiesService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    // Setup search with debounce
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.length >= 2) {
            this.isSearching = true;
            return this.citiesService.searchCities(query, 1, 5);
          } else {
            this.destinations = [];
            this.isSearching = false;
            return [];
          }
        }),
      )
      .subscribe({
        next: (response) => {
          console.log("Cities API response:", response);
          if (response && response.data) {
            this.destinations = response.data;
            console.log("Destinations set:", this.destinations);
          } else {
            this.destinations = [];
          }
          this.isSearching = false;
        },
        error: (error) => {
          console.error("Error searching cities:", error);
          this.destinations = [];
          this.isSearching = false;
        },
      });
  }

  ngOnInit() {
    // Initialize calendar
    this.generateCalendar();

    // Check for query parameters
    this.route.queryParams.subscribe((params) => {
      if (params["searchQuery"]) {
        this.searchQuery = decodeURIComponent(params["searchQuery"]);
      }

      if (params["travellers"]) {
        const travellers = parseInt(params["travellers"], 10);
        if (travellers >= 1 && travellers <= 4) {
          this.selectedSlot = travellers;
          this.customSlots = travellers;
        } else if (travellers > 4 && travellers <= 20) {
          this.selectedSlot = travellers;
          this.customSlots = travellers;
        }
      }

      if (params["formattedDate"]) {
        // Parse the formatted date (e.g., "21 Jan 2026")
        const dateStr = decodeURIComponent(params["formattedDate"]);
        const parsedDate = this.parseFormattedDate(dateStr);
        if (parsedDate) {
          this.selectedDate = parsedDate;
          this.currentMonth = parsedDate.getMonth();
          this.currentYear = parsedDate.getFullYear();
          this.generateCalendar();
        }
      }
    });
  }

  parseFormattedDate(dateStr: string): Date | null {
    try {
      // Parse format like "21 Jan 2026"
      const parts = dateStr.split(" ");
      if (parts.length !== 3) return null;

      const day = parseInt(parts[0], 10);
      const monthStr = parts[1];
      const year = parseInt(parts[2], 10);

      const monthIndex = this.monthNames.findIndex(
        (m) => m.toLowerCase() === monthStr.toLowerCase(),
      );

      if (monthIndex === -1 || isNaN(day) || isNaN(year)) return null;

      const date = new Date(year, monthIndex, day);
      date.setHours(0, 0, 0, 0);

      return date;
    } catch (error) {
      console.error("Error parsing date:", error);
      return null;
    }
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchQuery = input.value;
    console.log("Search query:", this.searchQuery);
    this.searchSubject.next(this.searchQuery);

    // Ensure dropdown is visible when typing
    if (this.searchQuery.length > 0) {
      this.showDestinationDropdown = true;
    }
  }

  selectDestination(city: City) {
    this.searchQuery = `${city.City}, ${city.State}`;
    this.showDestinationDropdown = false;
  }

  toggleDestinationDropdown() {
    this.showDestinationDropdown = !this.showDestinationDropdown;
    this.showDateDropdown = false;
    this.showTravellersDropdown = false;
  }

  toggleDateDropdown() {
    this.showDateDropdown = !this.showDateDropdown;
    this.showDestinationDropdown = false;
    this.showTravellersDropdown = false;
  }

  toggleTravellersDropdown() {
    this.showTravellersDropdown = !this.showTravellersDropdown;
    this.showDestinationDropdown = false;
    this.showDateDropdown = false;
  }

  selectSlot(slot: number) {
    this.selectedSlot = slot;
    this.customSlots = slot;
  }

  getTravellersText(): string {
    if (this.selectedSlot <= 4) {
      return `${this.selectedSlot} ${this.selectedSlot === 1 ? "Traveller" : "Travellers"}`;
    } else {
      return `${this.customSlots} Travellers`;
    }
  }

  incrementCustomSlots() {
    if (this.customSlots < 20) {
      this.customSlots++;
      this.selectedSlot = this.customSlots;
    }
  }

  decrementCustomSlots() {
    if (this.customSlots > 1) {
      this.customSlots--;
      this.selectedSlot = this.customSlots;
    }
  }

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
  }

  generateCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const prevLastDay = new Date(this.currentYear, this.currentMonth, 0);

    const firstDayOfWeek = firstDay.getDay();
    const lastDateOfMonth = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();

    // Adjust for Monday start (0 = Sunday, 1 = Monday, etc.)
    const startPadding = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    this.calendarDays = [];

    // Previous month days
    for (let i = startPadding; i > 0; i--) {
      this.calendarDays.push({
        date: prevLastDate - i + 1,
        otherMonth: true,
        fullDate: new Date(
          this.currentYear,
          this.currentMonth - 1,
          prevLastDate - i + 1,
        ),
      });
    }

    // Current month days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= lastDateOfMonth; i++) {
      const currentDate = new Date(this.currentYear, this.currentMonth, i);
      currentDate.setHours(0, 0, 0, 0);

      const isToday = currentDate.getTime() === today.getTime();
      const isPast = currentDate < today;
      const isSelected =
        this.selectedDate &&
        currentDate.getTime() ===
          new Date(this.selectedDate).setHours(0, 0, 0, 0);

      this.calendarDays.push({
        date: i,
        otherMonth: false,
        today: isToday,
        selected: isSelected,
        disabled: isPast,
        fullDate: currentDate,
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - this.calendarDays.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      this.calendarDays.push({
        date: i,
        otherMonth: true,
        fullDate: new Date(this.currentYear, this.currentMonth + 1, i),
      });
    }
  }

  selectDate(day: any) {
    if (day.otherMonth || day.disabled) {
      return;
    }

    this.selectedDate = day.fullDate;
    this.generateCalendar();
    console.log("Selected date:", this.selectedDate);

    // Close the dropdown after selection for better UX
    this.showDateDropdown = false;
  }

  getFormattedDate(): string {
    if (!this.selectedDate) {
      return "Trip Start Date";
    }

    const date = new Date(this.selectedDate);
    const day = date.getDate();
    const month = this.monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  }

  onSearch() {
    const searchParams = {
      travellers: this.selectedSlot <= 4 ? this.selectedSlot : this.customSlots,
      searchQuery: this.searchQuery,
      formattedDate: this.selectedDate ? this.getFormattedDate() : null,
    };

    console.log("Search Parameters:", searchParams);

    // Check if already on /home/allTrips route
    const currentUrl = this.router.url.split("?")[0]; // Get URL without query params

    if (currentUrl === "/home/allTrips") {
      // Already on allTrips page, emit event to refresh data
      console.log("Already on allTrips, emitting search event");
      this.searchService.triggerSearch(searchParams);

      // Update query params without navigation
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: searchParams,
        queryParamsHandling: "merge",
      });
    } else {
      // Navigate to allTrips with search parameters
      console.log("Navigating to allTrips");
      this.router.navigate(["/home/allTrips"], {
        queryParams: searchParams,
      });
    }
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const searchBar = target.closest(".search-bar");

    if (!searchBar) {
      this.showDestinationDropdown = false;
      this.showDateDropdown = false;
      this.showTravellersDropdown = false;
    }
  }
}
