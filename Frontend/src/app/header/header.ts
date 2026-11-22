import { Component, OnInit } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { Observable } from "rxjs";
import { filter } from "rxjs/operators";
import { Router, NavigationEnd } from "@angular/router";

@Component({
  selector: "app-header",
  standalone: false,
  templateUrl: "./header.html",
  styleUrl: "./header.css",
})
export class Header implements OnInit {
  activeTab = "traveller";
  isAuthenticated$!: Observable<boolean>;
  showProfileDropdown = false;
  showheader: boolean = true;

  constructor(
    private authService: AuthService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.showheader = !event.url.startsWith("/admin");
      });
  }

  setActiveTab(value: "traveller" | "host") {
    this.activeTab = value;
  }

  toggleProfileDropdown() {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  logout() {
    this.showProfileDropdown = false;
    this.authService.logout();
  }

  navigateToLogin() {
    this.router.navigate(["/login"]);
  }

  isLoginPage(): boolean {
    return this.router.url === "/login";
  }
}
