/**
 * Appointment DTOs
 *
 * Data Transfer Objects for appointments API
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

/**
 * Create Appointment Request
 * POST /api/appointments body
 */
export interface CreateAppointmentDto {
  professionalProfileId: string;
  date: string; // YYYY-MM-DD
  slotId: string;
  notes?: string;
}

/**
 * Create Appointment Response
 * POST /api/appointments response
 */
export interface CreateAppointmentResponseDto {
  id: string;
  status: AppointmentStatus;
  date: string;
  startTime: string;
  endTime: string;
  correlationId: string;
}

/**
 * Get appointment status label (Spanish)
 */
export function getStatusLabel(status: AppointmentStatus): string {
  const labels: Record<AppointmentStatus, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmada',
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
    (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED')
  );
}
