import { Component } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";

@Component({
  selector: "app-footer",
  standalone: false,
  templateUrl: "./footer.html",
  styleUrl: "./footer.css",
})
export class Footer {
  // Newsletter form state
  newsletterEmail = "";
  isSubmittingNewsletter = false;
  newsletterSuccessMessage = "";
  newsletterErrorMessage = "";

  // Contact form state
  isSubmittingContact = false;
  contactSuccessMessage = "";
  contactErrorMessage = "";

  contactForm = {
    name: "",
    email: "",
    message: "",
    phone: "",
  };

  constructor(private http: HttpClient) {}

  subscribeNewsletter() {
    // Validate email
    if (!this.newsletterEmail.trim()) {
      this.newsletterErrorMessage = "Please enter your email address";
      this.clearNewsletterMessages();
      return;
    }

    if (!this.isValidEmail(this.newsletterEmail)) {
      this.newsletterErrorMessage = "Please enter a valid email address";
      this.clearNewsletterMessages();
      return;
    }

    this.isSubmittingNewsletter = true;
    this.newsletterErrorMessage = "";
    this.newsletterSuccessMessage = "";

    this.http
      .post(`${environment.apiBaseUrl}/newsletter/subscribe`, {
        email: this.newsletterEmail,
      })
      .subscribe({
        next: () => {
          this.newsletterSuccessMessage =
            "Successfully subscribed to newsletter!";
          this.newsletterEmail = "";
          this.isSubmittingNewsletter = false;
          this.clearNewsletterMessages();
        },
        error: (error) => {
          this.newsletterErrorMessage =
            error.error?.message || "Failed to subscribe. Please try again.";
          this.isSubmittingNewsletter = false;
          this.clearNewsletterMessages();
        },
      });
  }

  submitContactForm() {
    // Validate all required fields
    if (!this.contactForm.name.trim()) {
      this.contactErrorMessage = "Please enter your name";
      this.clearContactMessages();
      return;
    }

    if (!this.contactForm.email.trim()) {
      this.contactErrorMessage = "Please enter your email address";
      this.clearContactMessages();
      return;
    }

    if (!this.isValidEmail(this.contactForm.email)) {
      this.contactErrorMessage = "Please enter a valid email address";
      this.clearContactMessages();
      return;
    }

    if (!this.contactForm.message.trim()) {
      this.contactErrorMessage = "Please enter your message";
      this.clearContactMessages();
      return;
    }

    this.isSubmittingContact = true;
    this.contactErrorMessage = "";
    this.contactSuccessMessage = "";

    this.http
      .post(`${environment.apiBaseUrl}/support/contact`, {
        name: this.contactForm.name,
        email: this.contactForm.email,
        phone: this.contactForm.phone,
        message: this.contactForm.message,
      })
      .subscribe({
        next: () => {
          this.contactSuccessMessage =
            "Message sent successfully! We will get back to you soon.";
          this.resetContactForm();
          this.isSubmittingContact = false;
          this.clearContactMessages();
        },
        error: (error) => {
          this.contactErrorMessage =
            error.error?.message || "Failed to send message. Please try again.";
          this.isSubmittingContact = false;
          this.clearContactMessages();
        },
      });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private resetContactForm() {
    this.contactForm = {
      name: "",
      email: "",
      message: "",
      phone: "",
    };
  }

  private clearNewsletterMessages() {
    setTimeout(() => {
      this.newsletterSuccessMessage = "";
      this.newsletterErrorMessage = "";
    }, 5000);
  }

  private clearContactMessages() {
    setTimeout(() => {
      this.contactSuccessMessage = "";
      this.contactErrorMessage = "";
    }, 5000);
  }
}
