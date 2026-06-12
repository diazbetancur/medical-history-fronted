import { inject, Injectable } from '@angular/core';
import {
  normalizeAppointmentStatus,
  type AppointmentDto,
  type AppointmentFilters,
  type AppointmentType,
  type CreateExternalAppointmentDto,
  type ExternalAppointmentSource,
  type PaginatedAppointmentsResponse,
} from '@data/models/appointment.models';
import { catchError, map, Observable, retry } from 'rxjs';
import { ApiClient } from './api-client';

/** Retry config for idempotent read calls: up to 2 retries with 1 s delay. */
const READ_RETRY = { count: 2, delay: 1000 } as const;

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
   * Listar citas del profesional.
   *
   * I-08: Siempre usa GET /appointments con professionalProfileId como query param.
   * Los nombres de parámetros coinciden con AppointmentFilterDto en el backend.
   */
  getAppointments(
    filters?: AppointmentFilters,
  ): Observable<PaginatedAppointmentsResponse> {
    const params: Record<string, string> = {};

    if (filters?.professionalId)
      params['professionalProfileId'] = filters.professionalId;
    if (filters?.patientId) params['patientId'] = filters.patientId;
    if (filters?.status) params['status'] = filters.status;
    if (filters?.from) params['startDate'] = filters.from;
    if (filters?.to) params['endDate'] = filters.to;
    if (filters?.page) params['page'] = String(filters.page);
    if (filters?.pageSize) params['pageSize'] = String(filters.pageSize);

    return this.apiClient
      .get<any>('/appointments', { params })
      .pipe(
        retry(READ_RETRY),
        map((response) => this.mapPaginatedResponse(response)),
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
      .get<any>(
        `/appointments/professional/${professionalId}/appointments/${appointmentId}`,
      )
      .pipe(
        retry(READ_RETRY),
        map((response) => this.mapAppointment(response)),
        catchError(() =>
          this.apiClient
            .get<any>(`/professional/appointments/${appointmentId}`)
            .pipe(
              retry(READ_RETRY),
              map((response) => this.mapAppointment(response)),
            ),
        ),
      );
  }

  /**
   * Confirmar cita
   */
  confirmAppointment(appointmentId: string): Observable<AppointmentDto> {
    return this.apiClient.post<AppointmentDto>(
      `/appointments/${appointmentId}/confirm`,
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
      `/appointments/${appointmentId}/cancel`,
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

  /**
   * Crear una cita externa (recibida por teléfono, WhatsApp, presencial, etc.)
   * El paciente no necesita ser un usuario registrado en el sistema.
   * La cita se crea con estado Confirmado.
   */
  createExternalAppointment(
    dto: CreateExternalAppointmentDto,
  ): Observable<AppointmentDto> {
    return this.apiClient
      .post<any>('/appointments/external', dto)
      .pipe(map((response) => this.mapAppointment(response)));
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
    const duration = this.toNumber(item?.duration ?? item?.durationMinutes, 0);
    const time = this.extractTimeRange(
      item?.timeSlot,
      item?.startTime,
      item?.endTime,
      duration,
      item?.startUtc,
      item?.endUtc,
    );

    return {
      id: item?.id ?? '',
      patientId: item?.patientId ?? '',
      patientProfileId: item?.patientProfileId,
      patientName:
        item?.patientName ??
        item?.patient?.fullName ??
        [item?.patient?.firstName, item?.patient?.lastName]
          .filter((value: string | undefined) => !!value)
          .join(' ') ??
        '',
      patientEmail: item?.patientEmail ?? item?.patient?.email,
      patientPhone: item?.patientPhone ?? item?.patient?.phone,
      professionalId: item?.professionalId ?? item?.professionalProfileId ?? '',
      professionalName: item?.professionalName ?? '',
      professionalSlug: item?.professionalSlug ?? '',
      institutionId: item?.institutionId,
      institutionName: item?.institutionName,
      date,
      timeSlot: item?.timeSlot,
      startUtc: item?.startUtc,
      endUtc: item?.endUtc,
      startTime: time.startTime,
      endTime: time.endTime,
      duration,
      status: normalizeAppointmentStatus(item?.status, item?.statusDisplay),
      reason: item?.reason,
      patientNotes: item?.patientNotes,
      professionalNotes: item?.professionalNotes,
      notes: item?.notes,
      observation: item?.observation,
      cancellationReason: item?.cancellationReason ?? item?.cancelReason,
      createdAt: item?.createdAt ?? item?.dateCreated ?? new Date().toISOString(),
      updatedAt:
        item?.updatedAt ??
        item?.dateModified ??
        item?.createdAt ??
        item?.dateCreated ??
        new Date().toISOString(),
      type: this.normalizeAppointmentType(item?.type),
      externalSource: this.normalizeExternalSource(item?.externalSource),
      externalNotes: item?.externalNotes,
    };
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
    durationMinutes = 0,
    startUtc?: unknown,
    endUtc?: unknown,
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
        const effectiveDuration =
          durationMinutes > 0
            ? durationMinutes
            : this.deriveDurationMinutes(startUtc, endUtc);
        return {
          startTime: slot,
          endTime:
            this.extractTime(endTime) ??
            this.addMinutesToTime(slot, effectiveDuration) ??
            this.extractTimeFromDate(endUtc) ??
            slot,
        };
      }
    }

    const normalizedStartTime =
      this.extractTime(startTime) ?? this.extractTimeFromDate(startUtc);
    const normalizedEndTime =
      this.extractTime(endTime) ??
      this.extractTimeFromDate(endUtc) ??
      (normalizedStartTime
        ? this.addMinutesToTime(normalizedStartTime, durationMinutes)
        : undefined);

    return {
      startTime: normalizedStartTime ?? '',
      endTime: normalizedEndTime ?? '',
    };
  }

  private extractTime(value: unknown): string | undefined {
    if (!value) return undefined;
    const text = String(value).trim();
    const match = text.match(/(\d{1,2}:\d{2})/);
    return match?.[1];
  }

  private extractTimeFromDate(value: unknown): string | undefined {
    if (!value) return undefined;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return undefined;

    return `${String(date.getHours()).padStart(2, '0')}:${String(
      date.getMinutes(),
    ).padStart(2, '0')}`;
  }

  private addMinutesToTime(value: string, minutes: number): string | undefined {
    if (!Number.isFinite(minutes) || minutes <= 0) return undefined;

    const match = value.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return undefined;

    const hours = Number(match[1]);
    const initialMinutes = Number(match[2]);
    if (
      !Number.isInteger(hours) ||
      !Number.isInteger(initialMinutes) ||
      hours < 0 ||
      hours > 23 ||
      initialMinutes < 0 ||
      initialMinutes > 59
    ) {
      return undefined;
    }

    const totalMinutes = hours * 60 + initialMinutes + minutes;
    const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
    const endHours = Math.floor(normalizedMinutes / 60);
    const endMinutes = normalizedMinutes % 60;

    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(
      2,
      '0',
    )}`;
  }

  private deriveDurationMinutes(startUtc: unknown, endUtc: unknown): number {
    if (!startUtc || !endUtc) return 0;
    const start = new Date(String(startUtc));
    const end = new Date(String(endUtc));
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  }

  private toNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private normalizeAppointmentType(type: unknown): AppointmentType {
    if (type === 1 || String(type).toUpperCase() === 'EXTERNAL') {
      return 'EXTERNAL';
    }
    return 'SYSTEM';
  }

  private normalizeExternalSource(
    source: unknown,
  ): ExternalAppointmentSource | undefined {
    if (source === null || source === undefined) return undefined;
    const byCode: Record<number, ExternalAppointmentSource> = {
      0: 'PHONE',
      1: 'WHATSAPP',
      2: 'IN_PERSON',
      3: 'EMAIL',
      99: 'OTHER',
    };
    if (typeof source === 'number') return byCode[source];
    if (typeof source !== 'string') return undefined;
    const upper = source.toUpperCase().replace(/\s/g, '_');
    if (upper === 'INPERSON') return 'IN_PERSON';
    return upper as ExternalAppointmentSource;
  }
}
