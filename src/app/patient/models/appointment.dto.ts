/**
 * Appointment DTOs
 *
 * Data Transfer Objects for appointments API
 */

// Re-export canonical types and utilities from the shared data models (M-02).
// `export…from` satisfies lint rule S7763 for the runtime export.
// The local `import type` below makes AppointmentStatus available to functions
// defined in this file without creating a duplicate symbol.
export { normalizeAppointmentStatus } from '@data/models/appointment.models';
export type { AppointmentStatus, AppointmentStatusCode } from '@data/models/appointment.models';

import type { AppointmentStatus } from '@data/models/appointment.models';

export interface AppointmentRawDto {
  id?: string;
  patientId?: string;
  professionalProfileId?: string;
  professionalId?: string;
  appointmentDate?: string;
  date?: string;
  timeSlot?: string;
  startTime?: string;
  endTime?: string;
  status?: string | number; // raw value from backend — use normalizeAppointmentStatus() to convert
  statusDisplay?: string;
  notes?: string;
  cancelReason?: string;
  cancellationReason?: string;
  professionalName?: string;
  specialtyName?: string;
  professional?: {
    id?: string;
    name?: string;
    specialty?: string;
    photoUrl?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Appointment DTO
 * GET /api/appointments/mine response item
 */
export interface AppointmentDto {
  id: string;
  patientId: string;
  professionalProfileId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
  cancelReason?: string;
  professional: {
    id: string;
    name: string;
    specialty: string;
    photoUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Appointments List Response
 * GET /api/appointments/mine response
 */
export interface AppointmentsListDto {
  appointments: AppointmentDto[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AppointmentsListRawDto {
  items?: AppointmentRawDto[];
  appointments?: AppointmentRawDto[];
  total?: number;
  count?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Create Appointment Request
 * POST /api/appointments body
 */
export interface CreateAppointmentDto {
  professionalProfileId: string;
  date?: string; // YYYY-MM-DD (legacy)
  slotId?: string; // legacy
  appointmentDate?: string; // YYYY-MM-DD (new)
  timeSlot?: string; // new
  observation?: string;
  notes?: string;
}

/**
 * Create Appointment Response
 * POST /api/appointments response
 */
export interface CreateAppointmentResponseDto {
  id: string;
  status: AppointmentStatus;
  date?: string;
  appointmentDate?: string;
  startTime: string;
  endTime: string;
  correlationId?: string;
}

/**
 * Get appointment status label (Spanish)
 */
export function getStatusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
    RESCHEDULED: 'Reprogramada',
    CANCELLED: 'Cancelada',
    COMPLETED: 'Completada',
    NO_SHOW: 'No asistió',
  };
  return labels[status];
}

/**
 * Get status color for UI
 */
export function getStatusColor(
  status: AppointmentStatus,
): 'primary' | 'accent' | 'warn' | undefined {
  const colors: Record<
    AppointmentStatus,
    'primary' | 'accent' | 'warn' | undefined
  > = {
    PENDING: 'warn',
    CONFIRMED: 'primary',
    RESCHEDULED: 'primary',
    CANCELLED: undefined,
    COMPLETED: 'accent',
    NO_SHOW: undefined,
  };
  return colors[status];
}

/**
 * Check if appointment is in the future
 */
export function isFutureAppointment(appointment: AppointmentDto): boolean {
  const appointmentDate = new Date(
    `${appointment.date}T${appointment.startTime}`,
  );
  return appointmentDate > new Date();
}

/**
 * Check if appointment can be cancelled
 */
export function canCancelAppointment(appointment: AppointmentDto): boolean {
  return (
    isFutureAppointment(appointment) &&
    (appointment.status === 'PENDING' ||
      appointment.status === 'CONFIRMED' ||
      appointment.status === 'RESCHEDULED')
  );
}
