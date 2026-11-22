import { Component } from "@angular/core";

@Component({
  selector: "app-contact",
  standalone: true,
  templateUrl: "./contact.html",
  styleUrls: ["./contact.css"],
})
export class ContactComponent {
  contactInfo = {
    email: "support@tripwiz.com",
    phone: "+1 (555) 123-4567",
    address: "123 Travel Street, Adventure City, AC 12345",
    hours: "Monday - Friday: 9:00 AM - 6:00 PM EST",
  };
}
