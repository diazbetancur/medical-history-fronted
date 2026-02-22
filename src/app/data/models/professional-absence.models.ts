/**
 * Professional Absence Models
 *
 * Modelos para gestionar ausencias del profesional (vacaciones, días no disponibles).
 */

export type AbsenceType = 'Absent' | 'Override';

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
  /** Fecha/hora inicio (ISO UTC) */
  startDateTime: string;
  /** Fecha/hora fin (ISO UTC) */
  endDateTime: string;
  /** Hora inicio override (HH:mm) */
  overrideStartTime?: string | null;
  /** Hora fin override (HH:mm) */
  overrideEndTime?: string | null;
  /** Sede asociada (opcional) */
  professionalLocationId?: string | null;
  /** Nombre de sede asociada (solo lectura) */
  professionalLocationName?: string | null;
  /** Motivo/nota (opcional) */
  reason?: string;
  /** Fecha de creación */
  createdAt?: string;
}

/**
 * DTO para crear ausencia
 */
export interface CreateAbsenceDto {
  /** Tipo de ausencia */
  type: AbsenceType;
  /** Fecha/hora inicio (ISO UTC) */
  startDateTime: string;
  /** Fecha/hora fin (ISO UTC) */
  endDateTime: string;
  /** Hora inicio override (HH:mm) */
  overrideStartTime?: string | null;
  /** Hora fin override (HH:mm) */
  overrideEndTime?: string | null;
  /** Sede para excepción (opcional) */
  professionalLocationId?: string | null;
  /** Institución de catálogo admin (legacy) */
  institutionId?: string | null;
  /** Motivo/nota (opcional) */
  reason?: string;
}

/**
 * DTO para actualizar ausencia
 */
export interface UpdateAbsenceDto {
  /** Tipo de ausencia */
  type?: AbsenceType;
  /** Fecha/hora inicio */
  startDateTime?: string;
  /** Fecha/hora fin */
  endDateTime?: string;
  /** Hora inicio override (HH:mm) */
  overrideStartTime?: string | null;
  /** Hora fin override (HH:mm) */
  overrideEndTime?: string | null;
  /** Sede para excepción (opcional) */
  professionalLocationId?: string | null;
  /** Institución de catálogo admin (legacy) */
  institutionId?: string | null;
  /** Motivo/nota */
  reason?: string;
}

/**
 * Filtros para listar ausencias
 */
export interface AbsenceFilters {
  /** Filtrar por rango de fechas (desde) */
  startDateTime?: string;
  /** Filtrar por rango de fechas (hasta) */
  endDateTime?: string;
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
  Absent: 'Ausente',
  Override: 'Horario especial',
};
