/**
 * HTTP Utilities
 *
 * Helper functions for building HTTP requests and parsing responses
 */

import { HttpHeaders, HttpParams } from '@angular/common/http';
import { ApiError, createApiError, ProblemDetails } from './api-error';

/**
 * Build HTTP headers
 * Automatically includes Content-Type, Authorization (if token provided)
 */
export function buildHeaders(token?: string | null): HttpHeaders {
  let headers = new HttpHeaders({
    'Content-Type': 'application/json',
  });

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

/**
 * Build HttpParams from object
 * Filters out null/undefined values
 */
export function buildParams(params?: Record<string, unknown>): HttpParams {
  let httpParams = new HttpParams();

  if (!params) {
    return httpParams;
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      httpParams = httpParams.set(key, String(value));
    }
  });

  return httpParams;
}

/**
 * Parse ProblemDetails from HTTP error
 * Extracts correlationId/traceId from headers if available
 */
export function parseProblemDetails(
  error: unknown,
  headers?: { get: (key: string) => string | null },
): ApiError {
  // Extract correlation ID from headers (X-Correlation-ID)
  const correlationId = headers?.get('X-Correlation-ID') ?? null;

  // Create unified ApiError
  return createApiError(error, correlationId);
}

/**
 * Check if response is ProblemDetails
 */
export function isProblemDetails(obj: unknown): obj is ProblemDetails {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'type' in obj &&
    'title' in obj &&
    'status' in obj
  );
}

/**
 * Format date to YYYY-MM-DD string
 */
export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYY-MM-DD string to Date
 */
export function parseDateOnly(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Build URL with path parameters
 * Example: buildUrl('/api/users/:id', { id: '123' }) => '/api/users/123'
 */
export function buildUrl(
  template: string,
  params: Record<string, string | number>,
): string {
  let url = template;
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, String(value));
  });
  return url;
}

/**
 * Retry configuration for HTTP requests
 */
export interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  retryOn?: (error: ApiError) => boolean;
}

/**
 * Default retry configuration
 * Retries on 5xx errors only
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  delayMs: 1000,
  retryOn: (error: ApiError) => error.status >= 500,
};
