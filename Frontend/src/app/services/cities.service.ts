import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

export interface City {
  City: string;
  State: string;
  District: string;
}

export interface CitiesResponse {
  status: string;
  message: string;
  data: City[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: "root",
})
export class CitiesService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  searchCities(
    query: string,
    page: number = 1,
    limit: number = 5,
  ): Observable<CitiesResponse> {
    return this.http.get<CitiesResponse>(
      `${this.apiUrl}/public/cities/search/city?q=${query}&page=${page}&limit=${limit}`,
    );
  }
}
