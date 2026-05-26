/**
 * Appointment Models
 *
 * Modelos para el sistema de citas/appointments
 */

/**
 * Appointment Status
 */
export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

/**
 * Appointment Type: system (booked via platform) vs external (added manually by professional)
 */
export type AppointmentType = 'SYSTEM' | 'EXTERNAL';

/**
 * External appointment source channel
 */
export type ExternalAppointmentSource =
  | 'PHONE'
  | 'WHATSAPP'
  | 'IN_PERSON'
  | 'EMAIL'
  | 'OTHER';

/** Human-readable labels for ExternalAppointmentSource */
export const EXTERNAL_SOURCE_LABELS: Record<ExternalAppointmentSource, string> =
  {
    PHONE: 'Teléfono',
    WHATSAPP: 'WhatsApp',
    IN_PERSON: 'Presencial',
    EMAIL: 'Correo electrónico',
    OTHER: 'Otro',
  };

/**
 * Appointment DTO - Entidad completa de cita
 */
export interface AppointmentDto {
  id: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  professionalName: string;
  professionalSlug: string;
  date: string; // ISO date (YYYY-MM-DD)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // minutes
  status: AppointmentStatus;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  /** Indicates if appointment was booked through the platform or added externally */
  type?: AppointmentType;
  /** Channel for external appointments */
  externalSource?: ExternalAppointmentSource;
  /** Professional-only notes for external appointments */
  externalNotes?: string;
}

/**
 * DTO for creating an external appointment (received via phone, WhatsApp, etc.)
 */
export interface CreateExternalAppointmentDto {
  /** Patient full name (free text — no system account required) */
  patientName: string;
  /** Patient email (optional) */
  patientEmail?: string;
  /** Patient phone (optional) */
  patientPhone?: string;
  /** Professional who owns the appointment */
  professionalProfileId: string;
  /** Optional institution */
  institutionId?: string;
  /** Appointment date in YYYY-MM-DD */
  appointmentDate: string;
  /** Time slot in HH:mm format */
  timeSlot: string;
  /** Duration in minutes (default 30) */
  durationMinutes?: number;
  /** Channel through which appointment was received */
  externalSource: number; // enum value: 0=Phone, 1=WhatsApp, 2=InPerson, 3=Email, 99=Other
  /** Reason for appointment */
  reason?: string;
  /** Internal notes (not shared with patient) */
  externalNotes?: string;
}

/**
 * Create Appointment DTO - Datos para crear una cita
 */
export interface CreateAppointmentDto {
  professionalId: string;
  date: string; // ISO date (YYYY-MM-DD)
  startTime: string; // HH:mm
  notes?: string;
}

/**
 * Update Appointment DTO - Datos para actualizar una cita
 */
export interface UpdateAppointmentDto {
  date?: string;
  startTime?: string;
  notes?: string;
  status?: AppointmentStatus;
  cancellationReason?: string;
}

/**
 * Appointment Filters - Filtros para búsqueda de citas
 */
export interface AppointmentFilters {
  patientId?: string;
  professionalId?: string;
  status?: AppointmentStatus;
  from?: string; // ISO date
  to?: string; // ISO date
  page?: number;
  pageSize?: number;
}

/**
 * Numeric status codes returned by the backend when serialising the enum as an integer.
 * Using this type prevents magic numbers from spreading across the codebase (M-02).
 */
export type AppointmentStatusCode = 0 | 1 | 2 | 3 | 4;

/** Map of backend integer codes → canonical string status (M-02). */
export const APPOINTMENT_STATUS_BY_CODE: Record<AppointmentStatusCode, AppointmentStatus> = {
  0: 'PENDING',
  1: 'CONFIRMED',
  2: 'CANCELLED',
  3: 'COMPLETED',
  4: 'NO_SHOW',
};

/**
 * Normalise a raw status value (string, numeric code, or undefined) coming from
 * the backend into the canonical `AppointmentStatus` union type (M-02).
 *
 * Usage:
 *   normalizeAppointmentStatus(item.status)          // from professional-appointments.api
 *   normalizeAppointmentStatus(item.status, item.statusDisplay) // with fallback display
 */
export function normalizeAppointmentStatus(
  status: string | number | undefined,
  statusDisplay?: string,
): AppointmentStatus {
  if (typeof status === 'number') {
    return APPOINTMENT_STATUS_BY_CODE[status as AppointmentStatusCode] ?? 'PENDING';
  }

  // Use || (not ??) so that an empty-string status also falls back to statusDisplay.
  const normalized = String(status || statusDisplay || '')
    .trim()
    .toUpperCase()
    .replaceAll(/\s+/g, '_')
    .replaceAll('-', '_');

  switch (normalized) {
    case 'PENDING':
    case 'CONFIRMED':
    case 'CANCELLED':
    case 'COMPLETED':
    case 'NO_SHOW':
      return normalized;
    case 'CANCELED':
      return 'CANCELLED';
    case 'NO_SHOWED':
    case 'NOSHOW':
      return 'NO_SHOW';
    default:
      return 'PENDING';
  }
}

/**
 * Paginated Appointments Response
 */
export interface PaginatedAppointmentsResponse {
  items: AppointmentDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
