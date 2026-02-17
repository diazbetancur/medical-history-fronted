/**
 * Professional Absence Models
 *
 * Modelos para gestionar ausencias del profesional (vacaciones, días no disponibles).
 */

export type AbsenceType =
  | 'VACATION'
  | 'SICK_LEAVE'
  | 'CONFERENCE'
  | 'PERSONAL'
  | 'OTHER';

/**
 * Ausencia/vacación del profesional
 */
export interface AbsenceDto {
  /** ID de la ausencia */
  id: string;
  /** ID del perfil profesional */
  professionalProfileId: string;
  /** Tipo de ausencia */
  type: AbsenceType;
  /** Fecha de inicio (ISO YYYY-MM-DD) */
  startDate: string;
  /** Fecha de fin (ISO YYYY-MM-DD, inclusive) */
  endDate: string;
  /** Motivo/nota (opcional) */
  reason?: string;
  /** Si se repite anualmente (ej: festivos) */
  isRecurring?: boolean;
  /** Fecha de creación */
  createdAt?: string;
}

/**
 * DTO para crear ausencia
 */
export interface CreateAbsenceDto {
  /** Tipo de ausencia */
  type: AbsenceType;
  /** Fecha de inicio (YYYY-MM-DD) */
  startDate: string;
  /** Fecha de fin (YYYY-MM-DD) */
  endDate: string;
  /** Motivo/nota (opcional) */
  reason?: string;
  /** Si se repite anualmente */
  isRecurring?: boolean;
}

/**
 * DTO para actualizar ausencia
 */
export interface UpdateAbsenceDto {
  /** Tipo de ausencia */
  type?: AbsenceType;
  /** Fecha de inicio */
  startDate?: string;
  /** Fecha de fin */
  endDate?: string;
  /** Motivo/nota */
  reason?: string;
  /** Si se repite anualmente */
  isRecurring?: boolean;
}

/**
 * Filtros para listar ausencias
 */
export interface AbsenceFilters {
  /** Filtrar por rango de fechas (desde) */
  startDate?: string;
  /** Filtrar por rango de fechas (hasta) */
  endDate?: string;
  /** Filtrar por tipo */
  type?: AbsenceType;
}

/**
 * Respuesta paginada de ausencias
 */
export interface PaginatedAbsencesResponse {
  items: AbsenceDto[];
  total: number;
}

/**
 * Nombres legibles de tipos de ausencia
 */
export const ABSENCE_TYPE_NAMES: Record<AbsenceType, string> = {
  VACATION: 'Vacaciones',
  SICK_LEAVE: 'Licencia Médica',
  CONFERENCE: 'Conferencia',
  PERSONAL: 'Personal',
  OTHER: 'Otro',
};
