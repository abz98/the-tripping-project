import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-admin-headers",
  standalone: false,
  templateUrl: "./admin-headers.html",
  styleUrls: ["./admin-headers.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHeadersComponent implements OnInit {
  userName: string = "Pawel Kuna";
  userAvatar: string = "/User.jpg";
  activeDropdown: string | null = "Trip Approvals";

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const tokenData = this.authService.getTokenData();
    if (tokenData) {
      this.userName = tokenData.name || tokenData.email || "Admin User";
      this.cdr.markForCheck();
    }
  }

  toggleDropdown(dropdown: string): void {
    this.activeDropdown = this.activeDropdown === dropdown ? null : dropdown;
    this.cdr.markForCheck();
    
    // Navigate based on dropdown selection
    if (dropdown === "Trip Approvals") {
      this.router.navigate(["/admin/trip"]);
    } else if (dropdown === "Category") {
      this.router.navigate(["/admin/category"]);
    }
  }

  navigateTo(route: string): void {
    this.activeDropdown = null;
    this.cdr.markForCheck();
    this.router.navigate([route]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(["/login"]);
  }
}
