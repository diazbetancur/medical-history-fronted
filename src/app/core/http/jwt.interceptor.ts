import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorage } from '@core/auth';
import { environment } from '@env';
import { catchError, throwError } from 'rxjs';

/**
 * Public/anonymous endpoints.
 * JWT token MUST NOT be attached to these routes.
 */
const PUBLIC_OR_ANONYMOUS_PATTERNS = [
  '/api/public/',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

/**
 * Check if URL targets our API backend
 */
function isApiRequest(url: string): boolean {
  const apiBase = environment.apiBaseUrl.replace(/\/+$/, '');
  return url.startsWith(apiBase) || url.includes('/api/');
}

/**
 * Check if endpoint is public/anonymous
 */
function isPublicOrAnonymous(url: string): boolean {
  return PUBLIC_OR_ANONYMOUS_PATTERNS.some((pattern) => url.includes(pattern));
}

/**
 * Check if request should include JWT
 */
function requiresAuth(url: string): boolean {
  return isApiRequest(url) && !isPublicOrAnonymous(url);
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
  next: HttpHandlerFn,
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
      }

      return throwError(() => error);
    }),
  );
};
