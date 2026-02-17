/**
 * Appointments API Types
 *
 * Type definitions for appointment/agenda functionality.
 * All dates are in UTC format (ISO 8601) from backend.
 * Frontend converts to local timezone for display.
 */

/**
 * Appointment status
 */
export type AppointmentStatus =
  | 'pending' // Created, awaiting confirmation
  | 'confirmed' // Confirmed by user
  | 'cancelled' // Cancelled by user or professional
  | 'completed' // Past appointment
  | 'no-show'; // User didn't show up

/**
 * Time slot availability
 */
export interface TimeSlot {
  /** Start time in UTC (ISO 8601: "2026-02-12T14:00:00Z") */
  startTime: string;

  /** End time in UTC (ISO 8601: "2026-02-12T15:00:00Z") */
  endTime: string;

  /** Whether this slot is available for booking */
  available: boolean;

  /** If not available, reason (optional) */
  reason?: string;
}

/**
 * Professional brief info for appointments
 */
export interface AppointmentProfessional {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialization?: string;
  profileImageUrl?: string;
}

/**
 * Client brief info for appointments
 */
export interface AppointmentClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

/**
 * Appointment (full)
 */
export interface Appointment {
  id: string;
  professional: AppointmentProfessional;
  client: AppointmentClient;

  /** Start time in UTC (ISO 8601) */
  startTime: string;

  /** End time in UTC (ISO 8601) */
  endTime: string;

  status: AppointmentStatus;

  /** Optional notes from client */
  notes?: string;

  /** Confirmation token (used for email confirmation) */
  confirmationToken?: string;

  /** Created at (UTC) */
  createdAt: string;

  /** Updated at (UTC) */
  updatedAt?: string;

  /** Confirmed at (UTC) */
  confirmedAt?: string;

  /** Cancelled at (UTC) */
  cancelledAt?: string;

  /** Cancellation reason */
  cancellationReason?: string;
}

/**
 * Create appointment request
 */
export interface CreateAppointmentRequest {
  professionalId: string;

  /** Start time in UTC (ISO 8601) */
  startTime: string;

  /** Optional notes from client */
  notes?: string;
}

/**
 * Create appointment response
 */
export interface CreateAppointmentResponse {
  appointment: Appointment;

  /** Message to display to user */
  message: string;
}

/**
 * Cancel appointment request
 */
export interface CancelAppointmentRequest {
  appointmentId: string;

  /** Reason for cancellation */
  reason?: string;
}

/**
 * Confirm appointment request
 */
export interface ConfirmAppointmentRequest {
  appointmentId: string;

  /** Confirmation token from email */
  token: string;
}

/**
 * Get available slots request
 */
export interface GetAvailableSlotsRequest {
  professionalId: string;

  /** Date in ISO format (YYYY-MM-DD) or full ISO 8601 */
  date: string;

  /** Optional slot duration filter in minutes */
  durationMinutes?: number;
}

/**
 * Get available slots response
 */
export interface GetAvailableSlotsResponse {
  professionalId: string;
  date: string;
  slots: TimeSlot[];
}

/**
 * Upcoming appointments response
 */
export interface UpcomingAppointmentsResponse {
  appointments: Appointment[];
  total: number;
}

/**
 * Export ICS request
 */
export interface ExportIcsRequest {
  appointmentId: string;
}
