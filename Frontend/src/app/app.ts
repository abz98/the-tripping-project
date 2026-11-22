import { Component, signal } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";

@Component({
  selector: "app-root",
  templateUrl: "./app.html",
  standalone: false,
  styleUrl: "./app.css",
})
export class App {
  isEdit: boolean = false;
  showFooter: boolean = true;
  protected readonly title = signal("angular");

  constructor(private router: Router) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Hide footer on admin and chat pages
        this.showFooter =
          !event.url.startsWith("/admin") && !event.url.startsWith("/chat");
      });
  }

  editMode(value: boolean) {
    this.isEdit = Boolean(value);
  }
}
