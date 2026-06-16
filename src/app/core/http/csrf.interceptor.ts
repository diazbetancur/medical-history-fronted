import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { CsrfTokenStore } from '@core/auth/csrf-token.store';
import { environment } from '@env';

/** Methods that mutate state and therefore require CSRF protection. */
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function isApiRequest(url: string): boolean {
  const apiBase = environment.apiBaseUrl.replace(/\/+$/, '');
  return url.startsWith(apiBase) || url.includes('/api/');
}

/**
 * CSRF Interceptor
 *
 * Echoes the in-memory anti-CSRF token back to the backend in the
 * `X-XSRF-TOKEN` header on unsafe API requests. The backend validates it
 * against the `csrf` claim in the JWT cookie.
 *
 * Angular's built-in XSRF support is not used here because it deliberately does
 * not attach the token to cross-origin (absolute URL) requests — and our API
 * lives on a different origin than the SPA.
 */
export const csrfInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const csrf = inject(CsrfTokenStore);
  const token = csrf.token();

  if (
    token &&
    isApiRequest(req.url) &&
    UNSAFE_METHODS.has(req.method.toUpperCase())
  ) {
    req = req.clone({ setHeaders: { 'X-XSRF-TOKEN': token } });
  }

  return next(req);
};
