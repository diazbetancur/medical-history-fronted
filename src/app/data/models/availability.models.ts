/**
 * Availability Models
 *
 * Modelos para disponibilidad y slots de profesionales
 */

/**
 * Time Slot DTO - Slot de tiempo disponible
 */
export interface TimeSlotDto {
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // minutes
  isAvailable: boolean;
  professionalId: string;
  date: string; // ISO date (YYYY-MM-DD)
}

/**
 * Availability Slots Response - Slots disponibles para una fecha
 */
export interface AvailabilitySlotsResponse {
  professionalId: string;
  professionalName: string;
  date: string; // ISO date (YYYY-MM-DD)
  slots: TimeSlotDto[];
}

/**
 * Professional Public Profile - Perfil público simplificado
 */
export interface ProfessionalPublicProfile {
  id: string;
  slug: string;
  name: string;
  title?: string;
  specialty?: string;
  bio?: string;
  avatarUrl?: string;
  rating?: number;
  reviewsCount?: number;
  location?: string;
  isActive: boolean;
}

/**
 * Search Professionals Filters
 */
export interface SearchProfessionalsFilters {
  query?: string; // Nombre o especialidad
  specialty?: string;
  location?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Paginated Professionals Response
 */
export interface PaginatedProfessionalsResponse {
  items: ProfessionalPublicProfile[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
