import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { TripsService } from "../services/trips.service";
import { environment } from "../../environments/environment";

declare var Razorpay: any;

@Component({
  selector: "app-payment",
  standalone: false,
  templateUrl: "./payment.html",
  styleUrl: "./payment.css",
})
export class PaymentComponent implements OnInit {
  paymentId: string = "";
  paymentDetails: any = null;
  loading = true;
  error = false;
  errorMessage = "";

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tripsService: TripsService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.paymentId = params["paymentId"];
      if (this.paymentId) {
        this.loadPaymentDetails();
      } else {
        this.error = true;
        this.errorMessage = "Invalid payment link";
        this.loading = false;
      }
    });
  }

  loadPaymentDetails() {
    this.loading = true;
    this.error = false;

    this.tripsService.getPaymentDetails(this.paymentId).subscribe({
      next: (response) => {
        if (response.status === "success" && response.data) {
          this.paymentDetails = response.data;
          this.loading = false;

          // Automatically open Razorpay if payment is pending
          if (this.paymentDetails.status === "PENDING") {
            setTimeout(() => this.initiatePayment(), 500);
          }
        } else {
          this.error = true;
          this.errorMessage = "Payment details not found";
          this.loading = false;
        }
      },
      error: (error) => {
        console.error("Error loading payment details:", error);
        this.error = true;
        this.errorMessage =
          error.error?.message || "Failed to load payment details";
        this.loading = false;
      },
    });
  }

  initiatePayment() {
    if (!this.paymentDetails) return;

    // Use Razorpay key from backend response or fallback to environment
    const razorpayKey =
      this.paymentDetails.razorpayKeyId || environment.razorpayKey;

    const options = {
      key: razorpayKey,
      amount: this.paymentDetails.amount * 100, // Amount in paise
      currency: this.paymentDetails.currency || "INR",
      name: "TripWiz",
      description: this.paymentDetails.description || "Trip Booking Payment",
      order_id: this.paymentDetails.razorpayOrderId,
      prefill: {
        name: this.paymentDetails.customerName || "",
        email: this.paymentDetails.customerEmail || "",
        contact: this.paymentDetails.customerPhone || "",
      },
      theme: {
        color: "#0d9488",
      },
      handler: (response: any) => {
        this.handlePaymentSuccess(response);
      },
      modal: {
        ondismiss: () => {
          console.log("Payment cancelled by user");
        },
      },
    };

    const razorpay = new Razorpay(options);
    razorpay.open();
  }

  handlePaymentSuccess(response: any) {
    console.log("Payment successful:", response);

    // Verify payment with backend
    this.tripsService
      .verifyPayment(this.paymentId, {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      })
      .subscribe({
        next: (verifyResponse) => {
          if (verifyResponse.status === "success") {
            alert("Payment successful! Your booking is confirmed.");
            // Redirect to success page or home
            this.router.navigate(["/home"]);
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        error: (error) => {
          console.error("Payment verification error:", error);
          alert("Payment verification failed. Please contact support.");
        },
      });
  }

  retryPayment() {
    this.initiatePayment();
  }
}
