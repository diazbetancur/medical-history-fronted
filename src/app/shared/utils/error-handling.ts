import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetails, getErrorMessage, hasFieldErrors } from '@data/api';

/**
 * Error handling utilities for API errors
 */

/**
 * Extracts the error body from HttpErrorResponse
 */
export function extractErrorBody(error: unknown): unknown {
  if (error instanceof HttpErrorResponse) {
    return error.error;
  }
  return error;
}

/**
 * Check if error is a network error (no response from server)
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof HttpErrorResponse) {
    return error.status === 0;
  }
  return false;
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: unknown): boolean {
  if (error instanceof HttpErrorResponse) {
    return error.status >= 500 && error.status < 600;
  }
  return false;
}

/**
 * Check if error is a client error (4xx)
 */
export function isClientError(error: unknown): boolean {
  if (error instanceof HttpErrorResponse) {
    return error.status >= 400 && error.status < 500;
  }
  return false;
}

/**
 * Check if error is unauthorized (401)
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof HttpErrorResponse) {
    return error.status === 401;
  }
  return false;
}

/**
 * Check if error is forbidden (403)
 */
export function isForbiddenError(error: unknown): boolean {
  if (error instanceof HttpErrorResponse) {
    return error.status === 403;
  }
  return false;
}

/**
 * Check if error is not found (404)
 */
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof HttpErrorResponse) {
    return error.status === 404;
  }
  return false;
}

/**
 * Check if error is conflict (409)
 */
export function isConflictError(error: unknown): boolean {
  if (error instanceof HttpErrorResponse) {
    return error.status === 409;
  }
  return false;
}

/**
 * Check if error is validation error (400 with field errors)
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof HttpErrorResponse && error.status === 400) {
    return hasFieldErrors(error.error);
  }
  return false;
}

/**
 * Get field errors from validation error
 */
export function getFieldErrors(
  error: unknown,
): Record<string, string[]> | null {
  const errorBody = extractErrorBody(error);
  if (hasFieldErrors(errorBody)) {
    return (errorBody as ProblemDetails).errors!;
  }
  return null;
}

/**
 * Get first error for a specific field
 */
export function getFieldError(
  error: unknown,
  fieldName: string,
): string | null {
  const fieldErrors = getFieldErrors(error);
  if (
    fieldErrors &&
    fieldErrors[fieldName] &&
    fieldErrors[fieldName].length > 0
  ) {
    return fieldErrors[fieldName][0];
  }
  return null;
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
  }

  if (isUnauthorizedError(error)) {
    return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
  }

  if (isForbiddenError(error)) {
    return 'No tienes permisos para realizar esta acción.';
  }

  if (isNotFoundError(error)) {
    return 'El recurso solicitado no fue encontrado.';
  }

  if (isServerError(error)) {
    return 'Ocurrió un error en el servidor. Por favor, intenta más tarde.';
  }

  // Try to get message from error body
  const errorBody = extractErrorBody(error);
  const message = getErrorMessage(errorBody);

  return message || 'Ha ocurrido un error inesperado.';
}

/**
 * Parse HTTP status code to string
 */
export function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    400: 'Solicitud inválida',
    401: 'No autorizado',
    403: 'Acceso denegado',
    404: 'No encontrado',
    409: 'Conflicto',
    500: 'Error del servidor',
    502: 'Gateway inválido',
    503: 'Servicio no disponible',
    504: 'Tiempo de espera agotado',
  };
  return statusTexts[status] || `Error ${status}`;
}

// Re-export from api-models for convenience
export { getErrorMessage, hasFieldErrors, isProblemDetails } from '@data/api';
