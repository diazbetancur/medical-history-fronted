/**
 * Availability Models
 *
 * Modelos para disponibilidad y slots de profesionales
 */

// ── Canonical slot types (I-11) ───────────────────────────────────────────────

/**
 * A single available slot returned by `GET /professional/:id/availability/slots`.
 *
 * Both local (professional TZ) and UTC times are included so the UI can show
 * the patient's browser time while also disambiguating when the professional
 * is in a different timezone (I-11).
 */
export interface SlotItemDto {
  /** ISO datetime in professional's local timezone (e.g. "2026-05-24T09:00:00") */
  startLocal: string;
  /** ISO datetime in professional's local timezone */
  endLocal: string;
  /** ISO datetime in UTC (e.g. "2026-05-24T14:00:00Z") — use for booking */
  startUtc: string;
  /** ISO datetime in UTC */
  endUtc: string;
  professionalLocationId: string | null;
  professionalLocationName: string | null;
  professionalLocationAddress: string | null;
}

/**
 * Response envelope for `GET /professional/:id/availability/slots`.
 */
export interface SlotResponseDto {
  /** ISO date (YYYY-MM-DD) of the requested day */
  date: string;
  /** IANA timezone of the professional (e.g. "America/Tegucigalpa") */
  timeZone: string;
  slotMinutes: number;
  totalSlots: number;
  items: SlotItemDto[];
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
