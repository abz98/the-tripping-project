import { inject } from "@angular/core";
import { Router, CanActivateFn } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (!authService.hasToken() || authService.isTokenExpired()) {
    router.navigate(["/login"], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Check if user has admin role
  if (authService.isAdmin()) {
    return true;
  }

  // Redirect to home if not admin
  router.navigate(["/home"]);
  return false;
};
