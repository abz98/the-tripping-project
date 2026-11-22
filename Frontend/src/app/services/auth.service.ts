import { Injectable, PLATFORM_ID, inject } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Observable, BehaviorSubject, throwError } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { environment } from "../../environments/environment";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  role: string;
}

export interface OtpVerifyRequest {
  email: string;
  otp: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface RefreshTokenResponse {
  status: string;
  message: string;
  data: {
    accessToken: string;
    expiresIn: number;
  };
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private apiUrl = environment.apiBaseUrl;
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private refreshTokenInProgress = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    // Initialize authentication state only in browser
    if (this.isBrowser) {
      this.isAuthenticatedSubject.next(this.hasToken());
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => {
          if (response.status === "success" && response.data) {
            this.setTokens(response.data);
            this.isAuthenticatedSubject.next(true);
          }
        }),
      );
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, data);
  }

  verifyOtp(data: OtpVerifyRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/otpVerify`, data);
  }

  googleLogin(credential: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/google`, { credential })
      .pipe(
        tap((response) => {
          if (response.status === "success" && response.data) {
            this.setTokens(response.data);
            this.isAuthenticatedSubject.next(true);
          }
        }),
      );
  }

  forgotPassword(data: { email: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, data);
  }

  resetPassword(data: {
    email: string;
    otp: string;
    newPassword: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, data);
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error("No refresh token available"));
    }

    return this.http
      .post<RefreshTokenResponse>(`${this.apiUrl}/auth/refresh`, {
        refreshToken: refreshToken,
      })
      .pipe(
        tap((response) => {
          if (response.status === "success" && response.data) {
            // Update only the access token, keep the refresh token
            const expiryDate = new Date();
            expiryDate.setSeconds(
              expiryDate.getSeconds() + response.data.expiresIn,
            );

            this.setCookie(
              "accessToken",
              response.data.accessToken,
              response.data.expiresIn,
            );
            this.setCookie(
              "tokenExpiry",
              expiryDate.toISOString(),
              response.data.expiresIn,
            );
            this.isAuthenticatedSubject.next(true);
          }
        }),
        catchError((error) => {
          // If refresh fails, logout the user
          this.logout();
          return throwError(() => error);
        }),
      );
  }

  isRefreshingToken(): boolean {
    return this.refreshTokenInProgress;
  }

  setRefreshingToken(value: boolean): void {
    this.refreshTokenInProgress = value;
  }

  getRefreshTokenSubject(): BehaviorSubject<string | null> {
    return this.refreshTokenSubject;
  }

  logout(): void {
    this.clearTokens();
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(["/login"]);
  }

  private setTokens(data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }): void {
    if (!this.isBrowser) return;

    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + data.expiresIn);

    this.setCookie("accessToken", data.accessToken, data.expiresIn);
    this.setCookie("refreshToken", data.refreshToken, 30 * 24 * 60 * 60); // 30 days
    this.setCookie("tokenExpiry", expiryDate.toISOString(), data.expiresIn);
  }

  private clearTokens(): void {
    if (!this.isBrowser) return;

    this.deleteCookie("accessToken");
    this.deleteCookie("refreshToken");
    this.deleteCookie("tokenExpiry");
  }

  getAccessToken(): string | null {
    if (!this.isBrowser) return null;
    return this.getCookie("accessToken");
  }

  getRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    return this.getCookie("refreshToken");
  }

  hasToken(): boolean {
    if (!this.isBrowser) return false;
    return !!this.getAccessToken();
  }

  isTokenExpired(): boolean {
    if (!this.isBrowser) return true;

    const expiry = this.getCookie("tokenExpiry");
    if (!expiry) return true;

    return new Date() >= new Date(expiry);
  }

  // Decode JWT token to get payload
  private decodeToken(token: string): any {
    try {
      const payload = token.split(".")[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }

  // Get user role from token
  getUserRole(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    const decoded = this.decodeToken(token);
    return decoded?.role || null;
  }

  // Check if user has admin role
  isAdmin(): boolean {
    const role = this.getUserRole();
    return role === "ADMIN";
  }

  // Get full decoded token data
  getTokenData(): any {
    const token = this.getAccessToken();
    if (!token) return null;

    return this.decodeToken(token);
  }

  private setCookie(name: string, value: string, seconds: number): void {
    if (!this.isBrowser) return;

    const date = new Date();
    date.setTime(date.getTime() + seconds * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
  }

  private getCookie(name: string): string | null {
    if (!this.isBrowser) return null;

    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  private deleteCookie(name: string): void {
    if (!this.isBrowser) return;

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }

  // LocalStorage methods for temporary data
  setTempEmail(email: string): void {
    if (!this.isBrowser) return;
    localStorage.setItem("tempEmail", email);
  }

  getTempEmail(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem("tempEmail");
  }

  clearTempEmail(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem("tempEmail");
  }
}
