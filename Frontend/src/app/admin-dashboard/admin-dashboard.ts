import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-admin-dashboard",
  standalone: false,
  templateUrl: "./admin-dashboard.html",
  styleUrls: ["./admin-dashboard.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard implements OnInit {
  adminName: string = "";
  stats = {
    totalUsers: 0,
    totalTrips: 0,
    totalBookings: 0,
    totalRevenue: 0,
  };

  recentActivities = [
    { type: "user", message: "New user registered", time: "5 minutes ago" },
    {
      type: "trip",
      message: "New trip created by host",
      time: "15 minutes ago",
    },
    {
      type: "booking",
      message: "New booking confirmed",
      time: "30 minutes ago",
    },
    { type: "review", message: "New review submitted", time: "1 hour ago" },
  ];

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadAdminData();
    this.loadStats();
  }

  loadAdminData(): void {
    const tokenData = this.authService.getTokenData();
    if (tokenData) {
      this.adminName = tokenData.name || tokenData.email || "Admin";
      this.cdr.markForCheck();
    }
  }

  loadStats(): void {
    // TODO: Replace with actual API calls
    this.stats = {
      totalUsers: 1247,
      totalTrips: 342,
      totalBookings: 856,
      totalRevenue: 125430,
    };
    this.cdr.markForCheck();
  }
}
