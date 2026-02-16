/**
 * Appointments Service
 *
 * Handles appointment API calls
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiError, createApiError } from '@core/http/api-error';
import { environment } from '@env';
import { catchError, Observable, throwError } from 'rxjs';
import {
  AppointmentsListDto,
  AppointmentStatus,
  CreateAppointmentDto,
  CreateAppointmentResponseDto,
} from '../models/appointment.dto';

@Injectable({
  providedIn: 'root',
})
export class AppointmentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/appointments`;

  /**
   * Get my appointments with optional filters
   * GET /api/appointments/mine
   */
  getMyAppointments(filters?: {
    status?: AppointmentStatus;
    page?: number;
    pageSize?: number;
  }): Observable<AppointmentsListDto> {
    let params = new HttpParams();

    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.page) {
      params = params.set('page', filters.page.toString());
    }
    if (filters?.pageSize) {
      params = params.set('pageSize', filters.pageSize.toString());
    }

    return this.http
      .get<AppointmentsListDto>(`${this.baseUrl}/mine`, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Create new appointment
   * POST /api/appointments
   *
   * May return 422 with TIME_SLOT_UNAVAILABLE if slot is taken
   */
  createAppointment(
    dto: CreateAppointmentDto,
  ): Observable<CreateAppointmentResponseDto> {
    return this.http
      .post<CreateAppointmentResponseDto>(this.baseUrl, dto)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Cancel appointment
   * DELETE /api/appointments/{id}
   */
  cancelAppointment(appointmentId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${appointmentId}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Handle HTTP errors and convert to ApiError
   */
  private handleError(error: unknown): Observable<never> {
    const apiError: ApiError = createApiError(error);
    return throwError(() => apiError);
  }
}
