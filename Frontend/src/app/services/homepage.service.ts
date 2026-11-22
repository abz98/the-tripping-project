import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  cta_text: string;
  cta_link: string;
  position: number;
  is_active?: boolean;
  start_date?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BannersResponse {
  status: string;
  message: string;
  data: Banner[];
}

export interface CategoryItem {
  id: string;
  name: string;
  type: "SEASON" | "DESTINATION" | "EXPERIENCE";
  icon_url: string;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoriesResponse {
  status: string;
  message: string;
  data: CategoryItem[];
}

@Injectable({
  providedIn: "root",
})
export class HomepageService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getBanners(): Observable<BannersResponse> {
    return this.http.get<BannersResponse>(`${this.apiUrl}/public/banners`);
  }

  getCategories(): Observable<CategoriesResponse> {
    return this.http.get<CategoriesResponse>(
      `${this.apiUrl}/public/categories`,
    );
  }
}
