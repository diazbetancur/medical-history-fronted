import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { retry } from 'rxjs/operators';
import { ApiClient } from './api-client';

/** Retry config for idempotent read calls: up to 2 retries with 1 s delay. */
const READ_RETRY = { count: 2, delay: 1000 } as const;
import type {
  Appointment,
  CancelAppointmentRequest,
  ConfirmAppointmentRequest,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  UpcomingAppointmentsResponse,
} from './appointments.types';

/**
 * Appointments API Service
 *
 * Handles all appointment/agenda HTTP requests.
 * Uses ApiClient which includes:
 * - X-Correlation-ID header (automatic)
 * - JWT authentication (automatic)
 * - ProblemDetails error handling (automatic)
 *
 * All dates from backend are in UTC (ISO 8601).
 * Components should convert to local timezone for display.
 */
@Injectable({ providedIn: 'root' })
export class AppointmentsApi {
  private readonly api = inject(ApiClient);

  /**
   * Create a new appointment
   */
  createAppointment(
    request: CreateAppointmentRequest,
  ): Observable<CreateAppointmentResponse> {
    return this.api.post<CreateAppointmentResponse>('/appointments', request);
  }

  /**
   * Cancel an appointment
   */
  cancelAppointment(request: CancelAppointmentRequest): Observable<void> {
    return this.api.post<void>(
      `/appointments/${request.appointmentId}/cancel`,
      request.reason ? { reason: request.reason } : null,
    );
  }

  /**
   * Confirm an appointment (using token from email)
   */
  confirmAppointment(
    request: ConfirmAppointmentRequest,
  ): Observable<Appointment> {
    return this.api.post<Appointment>(
      `/appointments/${request.appointmentId}/confirm`,
      { token: request.token },
    );
  }

  /**
   * Get appointment by ID
   */
  getById(id: string): Observable<Appointment> {
    return this.api
      .get<Appointment>(`/appointments/${id}`)
      .pipe(retry(READ_RETRY));
  }

  /**
   * Get upcoming appointments for current user
   *
   * Returns appointments in the future (status: pending, confirmed).
   * Past appointments are not included.
   */
  getUpcoming(): Observable<UpcomingAppointmentsResponse> {
    return this.api
      .get<UpcomingAppointmentsResponse>('/appointments/upcoming')
      .pipe(retry(READ_RETRY));
  }

  /**
   * Get all appointments for the authenticated patient
   * Includes past, current, and future appointments
   * Uses /appointments/mine endpoint
   */
  getMyAppointments(params?: {
    status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
    dateFrom?: string; // YYYY-MM-DD
    dateTo?: string; // YYYY-MM-DD
  }): Observable<UpcomingAppointmentsResponse> {
    return this.api
      .get<UpcomingAppointmentsResponse>('/appointments/mine', { params })
      .pipe(retry(READ_RETRY));
  }

  /**
   * Export appointment as ICS file (iCalendar format)
   *
   * Opens a download dialog in the browser.
   *
   * @param appointmentId - Appointment ID to export
   *
   * @example
   * ```typescript
   * exportToCalendar(appointmentId: string): void {
   *   this.appointmentsApi.exportIcs(appointmentId);
   * }
   * ```
   */
  exportIcs(appointmentId: string): void {
    const url = this.api.buildUrl(`/appointments/${appointmentId}/calendar`);

    // Open download in new window
    globalThis.open(url, '_blank');
  }
}
