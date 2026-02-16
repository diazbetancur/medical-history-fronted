import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TokenStorage } from '@core/auth';
import { ProblemDetails } from '@core/models';
import { environment } from '@env';
import { ToastService } from '@shared/services';
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
 * - Normalize errors to ProblemDetails format
 * - Handle 401 with redirect to login
 * - Handle 403 with redirect to forbidden page
 * - Show toast notifications for user feedback
 * - Log errors in development with correlation ID
 * - Never expose stack traces or technical errors to users
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const router = inject(Router);
  const tokenStorage = inject(TokenStorage);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Silent handling for specific endpoints (e.g., typeahead suggest)
      // Let the component/store handle these errors gracefully
      if (shouldSilenceError(req.url, error.status)) {
        return throwError(() => error);
      }

      // Extract correlation ID from request headers
      const correlationId = req.headers.get('X-Correlation-ID') || 'unknown';

      // Normalize error to ProblemDetails format
      const problemDetails = normalizeToProblemDetails(error, correlationId);

      // Handle 401 Unauthorized
      if (error.status === 401 && shouldRedirectToLogin(req.url)) {
        tokenStorage.clearToken();
        toast.error(problemDetails.title);

        // Only redirect if not already on login page
        if (!router.url.startsWith('/login')) {
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url, reason: 'session_expired' },
          });
        }
      }
      // Handle 403 Forbidden
      else if (error.status === 403) {
        toast.error(problemDetails.title);
        router.navigate(['/forbidden']);
      }
      // Show toast for other errors (except 404 on specific routes)
      else if (
        !(error.status === 404 && req.url.includes('/public/pages/profile/'))
      ) {
        // Build toast message with traceId in dev mode
        let toastMessage = problemDetails.title;
        if (!environment.production && problemDetails.traceId) {
          toastMessage += ` [ID: ${problemDetails.traceId.substring(0, 8)}...]`;
        }
        toast.error(toastMessage);
      }

      // Return error with ProblemDetails format
      return throwError(
        () =>
          new HttpErrorResponse({
            error: problemDetails,
            headers: error.headers,
            status: error.status,
            statusText: error.statusText,
            url: error.url || undefined,
          }),
      );
    }),
  );
};

/**
 * Normalize error response to ProblemDetails format
 */
function normalizeToProblemDetails(
  error: HttpErrorResponse,
  correlationId: string,
): ProblemDetails {
  // If backend already sent ProblemDetails, use it
  if (isProblemDetails(error.error)) {
    return {
      ...error.error,
      traceId: error.error.traceId || correlationId,
      timestamp: error.error.timestamp || new Date().toISOString(),
    };
  }

  // Extract error details from various formats
  const title =
    error.error?.title ||
    error.error?.message ||
    ERROR_MESSAGES[error.status] ||
    'Ha ocurrido un error inesperado';

  const detail =
    error.error?.detail || error.error?.message || error.message || undefined;

  const errorCode = error.error?.code || error.error?.errorCode || undefined;

  const validationErrors = error.error?.errors || undefined;

  // Construct standardized ProblemDetails
  return {
    type: `https://httpstatuses.com/${error.status}`,
    title,
    status: error.status,
    detail,
    traceId: correlationId,
    errorCode,
    errors: validationErrors,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Type guard to check if error is already ProblemDetails format
 */
function isProblemDetails(obj: any): obj is ProblemDetails {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.type === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.status === 'number'
  );
}
