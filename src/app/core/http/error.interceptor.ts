import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '@core/auth';
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

const PUBLIC_OR_ANONYMOUS_PATTERNS = [
  '/api/public/',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  // /me is probed on every app start to detect an existing session. A 401 here
  // just means "not logged in" — AuthStore.loadMe() clears state gracefully — so
  // it must NOT trigger the "session expired" redirect/notice.
  '/api/auth/me',
];
const LOCAL_FORBIDDEN_PATTERNS = ['/api/professional/patients/'];

/**
 * URLs that should have silent error handling (no logs, no enhanced messages)
 * These endpoints handle errors gracefully in the component/store level
 */
const SILENT_ERROR_URLS = ['/public/search/suggest'];
/**
 * Endpoints whose outages must stay transparent to the user. The notifications
 * bell polls these on a timer; a backend hiccup should not surface the generic
 * "Estamos presentando fallas" toast. The component already swallows the error
 * (catchError → fallback value), so we just suppress the global toast here.
 */
const SILENT_OUTAGE_TOAST_URLS = ['/notifications'];
const GENERIC_API_FAILURE_MESSAGE =
  'Estamos presentando fallas. Inténtalo nuevamente más tarde.';
const GENERIC_API_FAILURE_STATUSES = new Set([0, 502, 503, 504]);
const NETWORK_FAILURE_TOAST_WINDOW_MS = 4000;

let lastNetworkFailureToastAt = 0;

function isApiRequest(url: string): boolean {
  const apiBase = environment.apiBaseUrl.replace(/\/+$/, '');
  return url.startsWith(apiBase) || url.includes('/api/');
}

function isPublicOrAnonymous(url: string): boolean {
  return PUBLIC_OR_ANONYMOUS_PATTERNS.some((pattern) => url.includes(pattern));
}

/**
 * Check if error should trigger redirect to home
 */
function shouldRedirectToLogin(url: string): boolean {
  return isApiRequest(url) && !isPublicOrAnonymous(url);
}

function shouldHandleForbiddenLocally(url: string): boolean {
  return LOCAL_FORBIDDEN_PATTERNS.some((pattern) => url.includes(pattern));
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

function shouldSilenceOutageToast(url: string): boolean {
  return SILENT_OUTAGE_TOAST_URLS.some((pattern) => url.includes(pattern));
}

function isNetworkOrUnavailableError(error: HttpErrorResponse): boolean {
  if (GENERIC_API_FAILURE_STATUSES.has(error.status)) {
    return true;
  }

  return error.status === 0 || error.error instanceof ProgressEvent;
}

function showGenericApiFailureToast(toast: ToastService): void {
  const now = Date.now();

  if (now - lastNetworkFailureToastAt < NETWORK_FAILURE_TOAST_WINDOW_MS) {
    return;
  }

  lastNetworkFailureToastAt = now;
  toast.error(GENERIC_API_FAILURE_MESSAGE);
}

/**
 * Global Error Interceptor
 *
 * Responsibilities:
 * - Normalize errors to ProblemDetails format
 * - Handle 401 with redirect to home
 * - Handle 403 with redirect to forbidden page
 * - Show only a generic toast for network/API-unavailable failures
 * - Never expose stack traces or technical errors to users
 */
export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const router = inject(Router);
  const authStore = inject(AuthStore);
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
        authStore.expireSession();

        // Only redirect if not already on home
        if (router.url !== '/') {
          router.navigate(['/'], {
            queryParams: {
              returnTo: router.url,
              reason: 'session_expired',
              authRequired: '1',
            },
          });
        }
      }
      // Handle 403 Forbidden
      else if (
        error.status === 403 &&
        !shouldHandleForbiddenLocally(req.url)
      ) {
        toast.error(problemDetails.title);
        router.navigate(['/forbidden']);
      }
      // Phase 1: only show a global fallback toast for network/API outages,
      // but keep polled/background endpoints (e.g. notifications) transparent.
      else if (
        isApiRequest(req.url) &&
        isNetworkOrUnavailableError(error) &&
        !shouldSilenceOutageToast(req.url)
      ) {
        showGenericApiFailureToast(toast);
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
