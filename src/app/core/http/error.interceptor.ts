import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenStorage } from '@core/auth';
import { environment } from '@env';
import { catchError, throwError } from 'rxjs';

/**
 * User-friendly error messages by status code.
 * Avoids exposing technical details to users.
 */
const ERROR_MESSAGES: Record<number, string> = {
  0: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
  400: 'Los datos enviados no son válidos.',
  401: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  403: 'No tienes permisos para realizar esta acción.',
  404: 'El recurso solicitado no fue encontrado.',
  409: 'Esta operación no puede completarse debido a un conflicto.',
  422: 'Los datos enviados no pudieron ser procesados.',
  429: 'Demasiadas solicitudes. Por favor, espera un momento.',
  500: 'Ocurrió un error en el servidor. Por favor, intenta más tarde.',
  502: 'El servidor no está disponible. Por favor, intenta más tarde.',
  503: 'El servicio está temporalmente no disponible.',
  504: 'El servidor tardó demasiado en responder.',
};

/**
 * Routes that should redirect to login on 401
 */
const AUTH_ROUTES = ['/dashboard', '/admin', '/api/professional', '/api/admin'];

/**
 * URLs that should have silent error handling (no logs, no enhanced messages)
 * These endpoints handle errors gracefully in the component/store level
 */
const SILENT_ERROR_URLS = ['/public/search/suggest'];

/**
 * Check if error should trigger redirect to login
 */
function shouldRedirectToLogin(url: string): boolean {
  return AUTH_ROUTES.some((route) => url.includes(route));
}

/**
 * Check if error should be handled silently (no logging, passthrough)
 */
function shouldSilenceError(url: string, status: number): boolean {
  // Silence 400 errors for suggest endpoint - handled by TypeaheadStore
  if (
    status === 400 &&
    SILENT_ERROR_URLS.some((route) => url.includes(route))
  ) {
    return true;
  }
  return false;
}

/**
 * Global Error Interceptor
 *
 * Responsibilities:
 * - Standardize error messages for UI
 * - Handle 401 with redirect to login
 * - Log errors in development (suppressed in production)
 * - Never expose stack traces or technical errors to users
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const router = inject(Router);
  const tokenStorage = inject(TokenStorage);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Silent handling for specific endpoints (e.g., typeahead suggest)
      // Let the component/store handle these errors gracefully
      if (shouldSilenceError(req.url, error.status)) {
        return throwError(() => error);
      }

      // Log in development only
      if (!environment.production) {
        console.error(`[HTTP Error] ${req.method} ${req.url}`, {
          status: error.status,
          message: error.message,
          error: error.error,
        });
      }

      // Handle 401 Unauthorized
      if (error.status === 401 && shouldRedirectToLogin(req.url)) {
        tokenStorage.clearToken();

        // Only redirect if not already on login page
        if (!router.url.startsWith('/login')) {
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url, reason: 'session_expired' },
          });
        }
      }

      // Handle 403 Forbidden - redirect to appropriate page
      if (error.status === 403) {
        // Could redirect to an unauthorized page or home
        // For now, just let the error propagate with a clear message
      }

      // Handle 404 on profile pages - could redirect to not-found
      if (error.status === 404 && req.url.includes('/public/pages/profile/')) {
        // Let the component handle this for now
        // Could navigate to /not-found in the future
      }

      // Enhance error with user-friendly message if not already present
      const enhancedError = enhanceErrorMessage(error);

      return throwError(() => enhancedError);
    }),
  );
};

/**
 * Enhance error response with user-friendly message
 */
function enhanceErrorMessage(error: HttpErrorResponse): HttpErrorResponse {
  // If error already has a user-friendly message from API, keep it
  if (error.error?.message || error.error?.detail || error.error?.title) {
    return error;
  }

  // Get user-friendly message based on status
  const userMessage =
    ERROR_MESSAGES[error.status] ||
    'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.';

  // Create enhanced error object
  const enhancedErrorBody = {
    ...error.error,
    userMessage,
    originalStatus: error.status,
  };

  return new HttpErrorResponse({
    error: enhancedErrorBody,
    headers: error.headers,
    status: error.status,
    statusText: error.statusText,
    url: error.url || undefined,
  });
}
