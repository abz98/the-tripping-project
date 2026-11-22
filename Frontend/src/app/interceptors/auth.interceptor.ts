import { HttpInterceptorFn, HttpErrorResponse } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { catchError, switchMap, filter, take, throwError } from "rxjs";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Skip adding token for external APIs (like Razorpay)
  const isExternalApi =
    req.url.startsWith("https://api.razorpay.com") ||
    req.url.startsWith("https://checkout.razorpay.com");

  // Skip adding token for auth endpoints and public payment endpoints
  const skipAuth =
    isExternalApi ||
    req.url.includes("/auth/register") ||
    req.url.includes("/auth/login") ||
    req.url.includes("/auth/otpVerify") ||
    req.url.includes("/auth/refresh") ||
    req.url.includes("/public/payments") ||
    req.url.includes("/public/bookings");

  if (skipAuth) {
    return next(req);
  }

  // Add Authorization header with Bearer token
  const token = authService.getAccessToken();

  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // If we get a 401 error, try to refresh the token
        if (error.status === 401 && !authService.isRefreshingToken()) {
          authService.setRefreshingToken(true);

          return authService.refreshToken().pipe(
            switchMap(() => {
              authService.setRefreshingToken(false);

              // Retry the original request with the new token
              const newToken = authService.getAccessToken();
              const retryRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
              });

              return next(retryRequest);
            }),
            catchError((refreshError) => {
              authService.setRefreshingToken(false);
              // If refresh fails, logout and redirect to login
              authService.logout();
              return throwError(() => refreshError);
            }),
          );
        }

        // If already refreshing, wait for the refresh to complete
        if (error.status === 401 && authService.isRefreshingToken()) {
          return authService.getRefreshTokenSubject().pipe(
            filter((token) => token !== null),
            take(1),
            switchMap(() => {
              const newToken = authService.getAccessToken();
              const retryRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
              });
              return next(retryRequest);
            }),
          );
        }

        return throwError(() => error);
      }),
    );
  }

  return next(req);
};
