import { inject, Injectable } from '@angular/core';
import type {
  AppointmentDto,
  AppointmentFilters,
  PaginatedAppointmentsResponse,
} from '@data/models/appointment.models';
import { catchError, map, Observable } from 'rxjs';
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
    if (filters?.from) params.from = filters.from;
    if (filters?.to) params.to = filters.to;
    if (filters?.status) params.status = filters.status;
    if (filters?.patientId) params.patientId = filters.patientId;
    if (filters?.page) params.page = filters.page;
    if (filters?.pageSize) params.pageSize = filters.pageSize;

    const professionalId = filters?.professionalId;

    if (!professionalId) {
      return this.apiClient
        .get<PaginatedAppointmentsResponse>('/appointments/professional', {
          params,
        })
        .pipe(map((response) => this.mapPaginatedResponse(response)));
    }

    const pendingParams: any = {
      from: params.from,
      to: params.to,
      // status: params.status,
      // page: params.page,
      pageSize: params.pageSize,
    };

    return this.apiClient
      .get<any>(`/appointments/professional/${professionalId}/pending`, {
        params: pendingParams,
      })
      .pipe(
        map((response) => this.mapPaginatedResponse(response)),
        catchError((error) => {
          console.error('Error fetching pending appointments:', error);
          throw error;
        }),
      );
  }

  /**
   * Obtener cita específica
   */
  getAppointmentById(
    professionalId: string,
    appointmentId: string,
  ): Observable<AppointmentDto> {
    return this.apiClient
      .get<any>(`/professional/${professionalId}/appointments/${appointmentId}`)
      .pipe(
        map((response) => this.mapAppointment(response)),
        catchError(() =>
          this.apiClient
            .get<any>(`/professional/appointments/${appointmentId}`)
            .pipe(map((response) => this.mapAppointment(response))),
        ),
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

  private mapPaginatedResponse(response: any): PaginatedAppointmentsResponse {
    const items = Array.isArray(response?.items)
      ? response.items
      : Array.isArray(response?.appointments)
        ? response.appointments
        : [];

    const total =
      response?.total ??
      response?.totalCount ??
      response?.count ??
      items.length;
    const page = response?.page ?? 1;
    const pageSize = response?.pageSize ?? items.length;
    const totalPages =
      response?.totalPages ??
      Math.max(1, Math.ceil(total / Math.max(1, pageSize)));

    return {
      items: items.map((item: any) => this.mapAppointment(item)),
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  private mapAppointment(item: any): AppointmentDto {
    const date = this.extractDate(item?.appointmentDate ?? item?.date);
    const time = this.extractTimeRange(
      item?.timeSlot,
      item?.startTime,
      item?.endTime,
    );

    return {
      id: item?.id ?? '',
      patientId: item?.patientId ?? '',
      patientName: item?.patientName ?? '',
      professionalId: item?.professionalId ?? item?.professionalProfileId ?? '',
      professionalName: item?.professionalName ?? '',
      professionalSlug: item?.professionalSlug ?? '',
      date,
      startTime: time.startTime,
      endTime: time.endTime,
      duration: item?.duration ?? item?.durationMinutes ?? 0,
      status: this.normalizeStatus(item?.status, item?.statusDisplay),
      notes: item?.notes,
      cancellationReason: item?.cancellationReason ?? item?.cancelReason,
      createdAt: item?.createdAt ?? new Date().toISOString(),
      updatedAt: item?.updatedAt ?? item?.createdAt ?? new Date().toISOString(),
    };
  }

  private normalizeStatus(status: unknown, statusDisplay?: string): any {
    if (typeof status === 'number') {
      const byCode: Record<number, string> = {
        0: 'PENDING',
        1: 'CONFIRMED',
        2: 'CANCELLED',
        3: 'COMPLETED',
        4: 'NO_SHOW',
      };
      return byCode[status] ?? 'PENDING';
    }

    const normalized = String(status ?? statusDisplay ?? '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace('-', '_');

    if (
      normalized === 'PENDING' ||
      normalized === 'CONFIRMED' ||
      normalized === 'CANCELLED' ||
      normalized === 'COMPLETED' ||
      normalized === 'NO_SHOW'
    ) {
      return normalized;
    }

    if (normalized === 'CANCELED') return 'CANCELLED';
    if (normalized === 'NOSHOW') return 'NO_SHOW';
    return 'PENDING';
  }

  private extractDate(rawDate: unknown): string {
    if (!rawDate) return '';
    const value = String(rawDate);
    return value.includes('T') ? value.split('T')[0] : value;
  }

  private extractTimeRange(
    timeSlot: unknown,
    startTime: unknown,
    endTime: unknown,
  ): { startTime: string; endTime: string } {
    const slot = String(timeSlot ?? '').trim();
    if (slot) {
      const match = slot.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
      if (match) {
        return {
          startTime: match[1],
          endTime: match[2],
        };
      }

      if (/^\d{1,2}:\d{2}$/.test(slot)) {
        return {
          startTime: slot,
          endTime: String(endTime ?? slot),
        };
      }
    }

    return {
      startTime: String(startTime ?? ''),
      endTime: String(endTime ?? ''),
    };
  }
}
