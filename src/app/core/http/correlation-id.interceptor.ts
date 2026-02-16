import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';

/**
 * In-memory correlation ID for the current session.
 * Reused across all requests until page reload.
 */
let sessionCorrelationId: string | null = null;

/**
 * Generate a unique correlation ID.
 * Uses crypto.randomUUID() when available, fallback to timestamp-based ID.
 */
function generateCorrelationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: timestamp + random string
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/**
 * Get or create session correlation ID
 */
function getSessionCorrelationId(): string {
  if (!sessionCorrelationId) {
    sessionCorrelationId = generateCorrelationId();
  }

  return sessionCorrelationId;
}

/**
 * Correlation ID Interceptor
 *
 * Adds X-Correlation-ID header to all outgoing requests for end-to-end tracing.
 *
 * Features:
 * - Generates one correlation ID per session (reused across requests)
 * - Uses crypto.randomUUID() when available
 * - Falls back to timestamp-based ID for older browsers
 * - Logs correlation ID in development mode
 *
 * Benefits:
 * - Correlate frontend requests with backend logs
 * - Track user journeys across multiple API calls
 * - Debug issues with specific sessions
 *
 * @example
 * // Automatic - no action needed
 * // All HTTP requests will include: X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
 *
 * // In backend logs, filter by correlation ID:
 * // [Correlation: 550e8400-e29b-41d4-a716-446655440000] GET /api/users
 */
export const correlationIdInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) => {
  const correlationId = getSessionCorrelationId();

  // Clone request and add correlation ID header
  const clonedReq = req.clone({
    setHeaders: {
      'X-Correlation-ID': correlationId,
    },
  });

  return next(clonedReq);
};

/**
 * Reset session correlation ID (useful for testing)
 * Not exposed publicly - for internal use only
 */
export function resetCorrelationId(): void {
  sessionCorrelationId = null;
}
