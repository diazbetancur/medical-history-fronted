import { Injectable, inject } from '@angular/core';
import type {
  AppointmentDto,
  AppointmentFilters,
  PaginatedAppointmentsResponse,
} from '@data/models/appointment.models';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

/**
 * Professional Appointments API
 *
 * API para que el profesional gestione sus citas.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfessionalAppointmentsApi {
  private readonly apiClient = inject(ApiClient);

  /**
   * Listar citas del profesional
   */
  getAppointments(
    filters?: AppointmentFilters,
  ): Observable<PaginatedAppointmentsResponse> {
    const params: any = {};
    if (filters?.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters?.dateTo) params.dateTo = filters.dateTo;
    if (filters?.status) params.status = filters.status;
    if (filters?.patientId) params.patientId = filters.patientId;
    if (filters?.page) params.page = filters.page;
    if (filters?.pageSize) params.pageSize = filters.pageSize;

    return this.apiClient.get<PaginatedAppointmentsResponse>(
      '/professional/appointments',
      { params },
    );
  }

  /**
   * Obtener cita específica
   */
  getAppointmentById(appointmentId: string): Observable<AppointmentDto> {
    return this.apiClient.get<AppointmentDto>(
      `/professional/appointments/${appointmentId}`,
    );
  }

  /**
   * Confirmar cita
   */
  confirmAppointment(appointmentId: string): Observable<AppointmentDto> {
    return this.apiClient.post<AppointmentDto>(
      `/professional/appointments/${appointmentId}/confirm`,
      {},
    );
  }

  /**
   * Cancelar cita
   */
  cancelAppointment(
    appointmentId: string,
    reason?: string,
  ): Observable<AppointmentDto> {
    return this.apiClient.post<AppointmentDto>(
      `/professional/appointments/${appointmentId}/cancel`,
      { reason },
    );
  }

  /**
   * Marcar cita como completada
   */
  completeAppointment(appointmentId: string): Observable<AppointmentDto> {
    return this.apiClient.post<AppointmentDto>(
      `/professional/appointments/${appointmentId}/complete`,
      {},
    );
  }

  /**
   * Marcar paciente como no asistió (no-show)
   */
  markAsNoShow(appointmentId: string): Observable<AppointmentDto> {
    return this.apiClient.post<AppointmentDto>(
      `/professional/appointments/${appointmentId}/no-show`,
      {},
    );
  }
}
