/**
 * Unified API Error Model
 *
 * Normalizes all backend errors (ProblemDetails, plain JSON, etc.)
 * into a consistent structure for the frontend.
 */

/**
 * Unified API Error
 * All HTTP errors should be normalized to this structure
 */
export interface ApiError {
  /** HTTP status code */
  status: number;

  /** Error code (e.g., 'VALIDATION_ERROR', 'TIME_SLOT_UNAVAILABLE') */
  code: string;

  /** Human-readable error message */
  message: string;

  /** Correlation/Trace ID for debugging */
  traceId: string | null;

  /** Field-level validation errors (if applicable) */
  errors?: Record<string, string[]>;

  /** Original error details (for debugging) */
  details?: unknown;
}

/**
 * ProblemDetails format (RFC 7807)
 * Backend may return errors in this format
 */
export interface ProblemDetails {
  type: string; // Error code or URI
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  correlationId?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
}

/**
 * Known error codes from backend
 */
export enum ApiErrorCode {
  // Auth errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Patient profile errors
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Appointment errors
  TIME_SLOT_UNAVAILABLE = 'TIME_SLOT_UNAVAILABLE',
  APPOINTMENT_NOT_FOUND = 'APPOINTMENT_NOT_FOUND',
  CANNOT_CANCEL_PAST_APPOINTMENT = 'CANNOT_CANCEL_PAST_APPOINTMENT',

  // Professional errors
  PROFESSIONAL_NOT_FOUND = 'PROFESSIONAL_NOT_FOUND',

  // Generic errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST = 'BAD_REQUEST',
  NOT_FOUND = 'NOT_FOUND',
}

/**
 * Create ApiError from unknown error
 */
export function createApiError(
  error: unknown,
  traceId: string | null = null,
): ApiError {
  // If already ApiError, return as-is
  if (isApiError(error)) {
    return error;
  }

  // If HTTP error with ProblemDetails body
  if (
    error &&
    typeof error === 'object' &&
    'error' in error &&
    error.error &&
    typeof error.error === 'object'
  ) {
    const httpError = error as { status?: number; error: ProblemDetails };
    const problem = httpError.error;

    return {
      status: problem.status ?? httpError.status ?? 500,
      code: problem.type ?? 'INTERNAL_SERVER_ERROR',
      message: problem.title ?? problem.detail ?? 'Error desconocido',
      traceId: problem.correlationId ?? problem.traceId ?? traceId,
      errors: problem.errors,
      details: problem,
    };
  }

  // If plain error object
  if (error instanceof Error) {
    return {
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
      traceId,
      details: error,
    };
  }

  // Unknown error
  return {
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Error desconocido',
    traceId,
    details: error,
  };
}

/**
 * Check if object is ApiError
 */
export function isApiError(obj: unknown): obj is ApiError {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    'status' in obj &&
    'code' in obj &&
    'message' in obj
  );
}

/**
 * Check if error is specific code
 */
export function isErrorCode(error: ApiError, code: ApiErrorCode): boolean {
  return error.code === code;
}

/**
 * Get user-friendly error message
 */
export function getUserMessage(error: ApiError): string {
  // Map error codes to user-friendly messages
  switch (error.code) {
    case ApiErrorCode.TIME_SLOT_UNAVAILABLE:
      return 'El horario seleccionado ya no está disponible. Por favor, elige otro.';

    case ApiErrorCode.PROFILE_NOT_FOUND:
      return 'Perfil no encontrado. Por favor, completa tu perfil.';

    case ApiErrorCode.APPOINTMENT_NOT_FOUND:
      return 'Cita no encontrada.';

    case ApiErrorCode.CANNOT_CANCEL_PAST_APPOINTMENT:
      return 'No puedes cancelar una cita pasada.';

    case ApiErrorCode.PROFESSIONAL_NOT_FOUND:
      return 'Profesional no encontrado.';

    case ApiErrorCode.INVALID_CREDENTIALS:
      return 'Usuario o contraseña incorrectos.';

    case ApiErrorCode.UNAUTHORIZED:
      return 'Sesión expirada. Por favor, inicia sesión nuevamente.';

    case ApiErrorCode.FORBIDDEN:
      return 'No tienes permisos para realizar esta acción.';

    case ApiErrorCode.VALIDATION_ERROR:
      return 'Error de validación. Por favor, revisa los campos.';

    default:
      return (
        error.message || 'Ha ocurrido un error. Por favor, intenta nuevamente.'
      );
  }
}
