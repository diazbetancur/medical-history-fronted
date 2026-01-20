import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { TokenStorage } from '@core/auth';

/**
 * Routes that require JWT authentication.
 * Bearer token will ONLY be added to these paths.
 * Public endpoints (/public/*) never get the token.
 */
const AUTH_REQUIRED_PATTERNS = [
  '/api/auth/me',
  '/api/professional/',
  '/api/admin/',
];

/**
 * Check if the request URL requires authentication
 */
function requiresAuth(url: string): boolean {
  return AUTH_REQUIRED_PATTERNS.some((pattern) => url.includes(pattern));
}

/**
 * JWT Interceptor - Functional interceptor for Angular 19+
 *
 * Only attaches Bearer token to:
 * - /api/auth/me
 * - /api/professional/*
 * - /api/admin/*
 *
 * Does NOT attach token to:
 * - /api/auth/login
 * - /api/public/*
 */
export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const tokenStorage = inject(TokenStorage);

  // Only add auth header if route requires it and we have a valid token
  if (requiresAuth(req.url)) {
    const token = tokenStorage.getToken();

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 errors - token might be expired
      if (error.status === 401 && requiresAuth(req.url)) {
        // Clear invalid token
        tokenStorage.clearToken();

        // Log for debugging
        console.warn('[JWT Interceptor] Unauthorized - Token cleared');
      }

      return throwError(() => error);
    })
  );
};
