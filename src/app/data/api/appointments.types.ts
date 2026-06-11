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
  | 'rescheduled' // Reprogrammed appointment
  | 'cancelled' // Cancelled by user or professional
  | 'completed' // Past appointment
  | 'no-show'; // User didn't show up

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

  /** Consultation reason */
  Observation?: string;

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
  /** Optional reason for cancellation */
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
