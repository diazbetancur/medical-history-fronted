import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { environment } from '@env';

function isApiRequest(url: string): boolean {
  const apiBase = environment.apiBaseUrl.replace(/\/+$/, '');
  return url.startsWith(apiBase) || url.includes('/api/');
}

/**
 * JWT Interceptor - Functional interceptor for Angular 19+
 *
 * Adds withCredentials to API requests so the browser sends the httpOnly
 * auth cookie automatically. No Authorization header is needed.
 */
export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  if (isApiRequest(req.url)) {
    req = req.clone({ withCredentials: true });
  }

  return next(req);
};
