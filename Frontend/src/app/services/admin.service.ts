import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

export interface AdminTripResponse {
  status: string;
  message: string;
  data: AdminTrip[];
}

export interface AdminTrip {
  id: string;
  tripName: string;
  destination: string[];
  base_price: number;
  duration_days: number;
  duration_nights: number;
  status: string;
  createdAt: string;
  hostDetails?: {
    id?: string;
    name?: string;
    email?: string;
    avatar?: string;
  };
}

export interface AdminCategoryResponse {
  status: string;
  message: string;
  data: AdminCategory[];
}

export interface AdminCategory {
  id: string;
  name: string;
  type: "EXPERIENCE" | "DESTINATION" | "SEASON";
  icon_url: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TripApprovalRequest {
  tripId: string;
  status: "APPROVED" | "REJECTED";
  reason?: string;
}

@Injectable({
  providedIn: "root",
})
export class AdminService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getPendingTrips(): Observable<AdminTripResponse> {
    return this.http.get<AdminTripResponse>(
      `${this.apiUrl}/admin/trips/pending`,
    );
  }

  reviewTrip(
    tripId: string,
    status: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED",
    reasons: string[],
    adminMessage?: string,
  ): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/trips/${tripId}/review`, {
      status,
      reasons,
      admin_message: adminMessage,
    });
  }

  approveTrip(
    tripId: string,
    reasons: string[],
    adminMessage?: string,
  ): Observable<any> {
    return this.reviewTrip(tripId, "APPROVED", reasons, adminMessage);
  }

  rejectTrip(
    tripId: string,
    reasons: string[],
    adminMessage?: string,
  ): Observable<any> {
    return this.reviewTrip(tripId, "REJECTED", reasons, adminMessage);
  }

  deleteTrip(tripId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/trips/${tripId}`);
  }

  getTripDetails(tripId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/trips/${tripId}`);
  }

  // Category Management
  getCategories(): Observable<AdminCategoryResponse> {
    return this.http.get<AdminCategoryResponse>(
      `${this.apiUrl}/admin/categories`,
    );
  }

  createCategory(categoryData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/categories`, categoryData);
  }

  updateCategory(categoryId: string, categoryData: FormData): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/admin/categories/${categoryId}`,
      categoryData,
    );
  }

  deleteCategory(categoryId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/categories/${categoryId}`);
  }

  toggleCategoryStatus(categoryId: string, isActive: boolean): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/admin/categories/${categoryId}/status`,
      { is_active: isActive },
    );
  }
}
