import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import type {
  Appointment,
  CancelAppointmentRequest,
  ConfirmAppointmentRequest,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  GetAvailableSlotsRequest,
  GetAvailableSlotsResponse,
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
   * Get available time slots for a professional on a specific date
   *
   * @param request - Professional ID and date
   * @returns Observable with available slots (times in UTC)
   *
   * @example
   * ```typescript
   * this.appointmentsApi.getAvailableSlots({
   *   professionalId: 'prof-123',
   *   date: '2026-02-15' // or full ISO: '2026-02-15T00:00:00Z'
   * }).subscribe({
   *   next: (response) => {
   *     // response.slots = [{ startTime: "2026-02-15T14:00:00Z", endTime: "...", available: true }]
   *   }
   * });
   * ```
   */
  getAvailableSlots(
    request: GetAvailableSlotsRequest,
  ): Observable<GetAvailableSlotsResponse> {
    const params = {
      professionalId: request.professionalId,
      date: request.date,
      ...(request.durationMinutes
        ? { durationMinutes: request.durationMinutes }
        : {}),
    };

    return this.api.get<GetAvailableSlotsResponse>('/appointments/slots', {
      params,
    });
  }

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
  cancelAppointment(
    request: CancelAppointmentRequest,
  ): Observable<Appointment> {
    return this.api.post<Appointment>(
      `/appointments/${request.appointmentId}/cancel`,
      { reason: request.reason },
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
    return this.api.get<Appointment>(`/appointments/${id}`);
  }

  /**
   * Get upcoming appointments for current user
   *
   * Returns appointments in the future (status: pending, confirmed).
   * Past appointments are not included.
   */
  getUpcoming(): Observable<UpcomingAppointmentsResponse> {
    return this.api.get<UpcomingAppointmentsResponse>('/appointments/upcoming');
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
    return this.api.get<UpcomingAppointmentsResponse>('/appointments/mine', {
      params,
    });
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
