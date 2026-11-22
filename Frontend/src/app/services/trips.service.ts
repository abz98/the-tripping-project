import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

export interface TripCreateData {
  title: string;
  tripId?: string;
  categoryId: string[];
  destination: string[];
  pricePerPerson: number;
  route: {
    startLocation: string;
    endLocation: string;
    pickupLocations: string[];
  };
  tags: string[];
  batches: Array<{
    startDate: string;
    endDate: string;
    duration: {
      nights: number;
      days: number;
    };
    totalSlots: number;
  }>;
  aboutTrip: string;
  cancellationPolicy: {
    type: "FREE" | "PARTIAL" | "NONE";
    freeCancellationDay?: number;
  };
  additionalMessage: string;
  status:
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "CHANGES_REQUESTED"
    | "REJECTED"
    | "PUBLISHED"
    | "ARCHIVED";
  images: File[];
}

export interface TripCreateResponse {
  status: string;
  message: string;
  data: any;
}

export interface Trip {
  id: string;
  host: {
    id: string;
    name: string;
    email: string;
  };
  title: string;
  categoryId: string[];
  destination: string[];
  pricePerPerson: number;
  route: {
    startLocation: string;
    endLocation: string;
    pickupLocations: string[];
  };
  tags: string[];
  batches: Array<{
    id: string;
    startDate: string;
    endDate: string;
    duration: {
      nights: number;
      days: number;
    };
    totalSlots: number;
    availableSlots: number;
    status: string;
  }>;
  images: string[];
  aboutTrip: string;
  cancellationPolicy: {
    type: "FREE" | "PARTIAL" | "NONE";
    freeCancellationDay?: number;
  };
  additionalMessage: string;
  tripRequestDescription: string;
  status:
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "CHANGES_REQUESTED"
    | "REJECTED"
    | "PUBLISHED"
    | "ARCHIVED";
  is_featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TripsListResponse {
  status: string;
  message: string;
  data: Trip[];
}

@Injectable({
  providedIn: "root",
})
export class TripsService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  createOrEditTrip(tripData: TripCreateData): Observable<TripCreateResponse> {
    const formData = new FormData();

    // Add all non-file fields
    formData.append("title", tripData.title);
    formData.append("categoryId", JSON.stringify(tripData.categoryId));
    formData.append("destination", JSON.stringify(tripData.destination));
    formData.append("pricePerPerson", tripData.pricePerPerson.toString());
    formData.append("route", JSON.stringify(tripData.route));
    formData.append("tags", JSON.stringify(tripData.tags));
    formData.append("batches", JSON.stringify(tripData.batches));
    formData.append("aboutTrip", tripData.aboutTrip);
    formData.append(
      "cancellationPolicy",
      JSON.stringify(tripData.cancellationPolicy),
    );
    formData.append("additionalMessage", tripData.additionalMessage);
    formData.append("status", tripData.status);

    // Add image files
    console.log("Adding images to FormData:", tripData.images.length);
    tripData.images.forEach((file, index) => {
      console.log(`Image ${index}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      formData.append("images", file, file.name);
    });

    // Debug: Log FormData contents
    console.log("FormData entries:");
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(
          `${key}:`,
          `File(${value.name}, ${value.size} bytes, ${value.type})`,
        );
      } else {
        console.log(`${key}:`, value);
      }
    });

    // Determine if this is a create or edit operation
    if (tripData.tripId) {
      return this.http.put<TripCreateResponse>(
        `${this.apiUrl}/host/trips/${tripData.tripId}`,
        formData,
      );
    } else {
      return this.http.post<TripCreateResponse>(
        `${this.apiUrl}/host/trips`,
        formData,
      );
    }
  }

  getHostTrips(): Observable<TripsListResponse> {
    return this.http.get<TripsListResponse>(`${this.apiUrl}/host/trips`);
  }

  getAllTrips(queryParams?: any): Observable<TripsListResponse> {
    let url = `${this.apiUrl}/public/trips`;

    // Build query string if parameters exist
    if (queryParams && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams();

      Object.keys(queryParams).forEach((key) => {
        if (
          queryParams[key] !== null &&
          queryParams[key] !== undefined &&
          queryParams[key] !== ""
        ) {
          params.append(key, queryParams[key].toString());
        }
      });

      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.http.get<TripsListResponse>(url);
  }

  getTripById(
    tripId: string,
  ): Observable<{ status: string; message: string; data: Trip }> {
    return this.http.get<{ status: string; message: string; data: Trip }>(
      `${this.apiUrl}/public/trips/${tripId}`,
    );
  }

  submitTripRequest(formData: any) {
    return this.http.post<TripCreateResponse>(
      `${this.apiUrl}/bookings`,
      formData,
    );
  }

  getTripsByCategory(categoryId: string): Observable<TripsListResponse> {
    let url = `${this.apiUrl}/public/trips/category/${categoryId}`;
    return this.http.get<TripsListResponse>(url);
  }

  deleteTrip(tripId: string): Observable<{ status: string; message: string }> {
    return this.http.delete<{ status: string; message: string }>(
      `${this.apiUrl}/host/trips/${tripId}`,
    );
  }

  getTripModeration(tripId: string): Observable<{
    status: string;
    message: string;
    data: Array<{
      id: string;
      status: string;
      reasons: string[];
      admin_message: string;
      reviewed_at: string;
    }>;
  }> {
    return this.http.get<{
      status: string;
      message: string;
      data: Array<{
        id: string;
        status: string;
        reasons: string[];
        admin_message: string;
        reviewed_at: string;
      }>;
    }>(`${this.apiUrl}/host/trips/${tripId}/moderation`);
  }

  getPendingBookings(): Observable<{
    status: string;
    message: string;
    data: any[];
  }> {
    return this.http.get<{
      status: string;
      message: string;
      data: any[];
    }>(`${this.apiUrl}/host/bookings/pending`);
  }

  rejectBooking(
    bookingId: string,
    reason: string,
  ): Observable<{
    status: string;
    message: string;
  }> {
    return this.http.post<{
      status: string;
      message: string;
    }>(`${this.apiUrl}/host/bookings/${bookingId}/reject`, { reason });
  }

  confirmBooking(bookingId: string): Observable<{
    status: string;
    message: string;
  }> {
    return this.http.post<{
      status: string;
      message: string;
    }>(`${this.apiUrl}/host/bookings/${bookingId}/confirm`, {});
  }

  getPaymentDetails(paymentId: string): Observable<{
    status: string;
    message: string;
    data: {
      paymentId: string;
      bookingId: string;
      tripTitle: string;
      amount: number;
      currency: string;
      status: "PENDING" | "COMPLETED" | "FAILED";
      razorpayOrderId: string;
      razorpayKeyId: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      description: string;
    };
  }> {
    return this.http.get<{
      status: string;
      message: string;
      data: any;
    }>(`${this.apiUrl}/public/bookings/${paymentId}/payment`);
  }

  verifyPayment(
    paymentId: string,
    verificationData: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    },
  ): Observable<{
    status: string;
    message: string;
  }> {
    return this.http.post<{
      status: string;
      message: string;
    }>(`${this.apiUrl}/public/payments/verify`, verificationData);
  }
}
