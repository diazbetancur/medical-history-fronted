import {
  type HttpHandlerFn,
  type HttpInterceptorFn,
  type HttpRequest,
  HttpStatusCode,
} from '@angular/common/http';
import { retry, timer } from 'rxjs';

/**
 * Retry Interceptor (M-05)
 *
 * Automatically retries **read-only (GET / HEAD / OPTIONS)** requests that fail
 * due to transient network or server errors (5xx, 0 / timeout).
 *
 * Rules:
 *  • Only idempotent methods: GET, HEAD, OPTIONS
 *  • Only retryable status codes: network error (status 0), 5xx server errors
 *  • 4xx errors (bad request, unauthorised, not found) are NOT retried —
 *    they are deterministic failures that won't resolve on retry.
 *  • Max 2 retries with exponential backoff: 1s → 2s
 *
 * Mutations (POST, PUT, PATCH, DELETE) are intentionally excluded because
 * retrying them could cause duplicate writes.
 */
export const retryInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const isIdempotent =
    req.method === 'GET' ||
    req.method === 'HEAD' ||
    req.method === 'OPTIONS';

  if (!isIdempotent) {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: 2,
      delay: (error, retryIndex) => {
        // Only retry on network errors (status 0) and 5xx server errors.
        const status: number = error?.status ?? 0;
        const isRetryable =
          status === 0 || // network / timeout
          status === HttpStatusCode.BadGateway ||           // 502
          status === HttpStatusCode.ServiceUnavailable ||   // 503
          status === HttpStatusCode.GatewayTimeout ||       // 504
          status === HttpStatusCode.InternalServerError;    // 500

        if (!isRetryable) {
          throw error; // propagate immediately — not worth retrying
        }

        // Exponential backoff: 1s, 2s
        const delayMs = retryIndex * 1000;
        return timer(delayMs);
      },
    }),
  );
};
