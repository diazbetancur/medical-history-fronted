import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Guard that checks if user is authenticated.
 * Redirects to /login if not authenticated.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store intended URL for redirect after login
  const returnUrl = state.url;
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl },
  });
};
