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
  dateFrom?: string; // ISO date
  dateTo?: string; // ISO date
  page?: number;
  pageSize?: number;
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
