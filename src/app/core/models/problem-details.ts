/**
 * RFC 7807 Problem Details
 * Standardized error response format for HTTP APIs
 * https://tools.ietf.org/html/rfc7807
 */
export interface ProblemDetails {
  /** Error type identifier (URI reference) */
  type: string;

  /** Human-readable summary (user-friendly) */
  title: string;

  /** HTTP status code */
  status: number;

  /** Detailed explanation (optional) */
  detail?: string;

  /** URI reference identifying the specific problem instance (optional) */
  instance?: string;

  /** Correlation/Trace ID for debugging (optional) */
  traceId?: string;

  /** Application-specific error code (optional) */
  errorCode?: string;

  /** ISO 8601 timestamp of when the error occurred (optional) */
  timestamp?: string;

  /** Validation errors by field name (optional) */
  errors?: Record<string, string[]>;
}
