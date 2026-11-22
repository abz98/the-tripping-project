import { Component, Output, EventEmitter } from "@angular/core";
import { Router } from "@angular/router";

@Component({
  selector: "app-host-panel",
  standalone: false,
  templateUrl: "./host-panel.html",
  styleUrl: "./host-panel.css",
})
export class HostPanel {
  activeTab:
    | "active"
    | "pending"
    | "rejected"
    | "drafts"
    | "past"
    | "Trip Requests"
    | "pending_approval" = "active";

  constructor(private router: Router) {}

  setActiveTab(
    value:
      | "active"
      | "pending"
      | "rejected"
      | "drafts"
      | "past"
      | "Trip Requests"
      | "pending_approval",
  ) {
    this.activeTab = value;
  }

  navigateToCreateTrip() {
    this.router.navigate(["/host/edit"]);
  }
}
