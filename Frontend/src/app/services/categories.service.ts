import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

export interface Category {
  id: string;
  name: string;
  type: string;
  icon_url: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoriesResponse {
  status: string;
  message: string;
  data: Category[];
}

@Injectable({
  providedIn: "root",
})
export class CategoriesService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<CategoriesResponse> {
    return this.http.get<CategoriesResponse>(
      `${this.apiUrl}/public/categories`,
    );
  }
}
