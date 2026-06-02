/**
 * Appointments Service
 *
 * Handles appointment API calls
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiError, createApiError } from '@core/http/api-error';
import { environment } from '@env';
import { catchError, map, Observable, throwError } from 'rxjs';
import {
  AppointmentDto,
  AppointmentsListDto,
  AppointmentsListRawDto,
  AppointmentStatus,
  CreateAppointmentDto,
  CreateAppointmentResponseDto,
  normalizeAppointmentStatus,
} from '../models/appointment.dto';

export interface RelatedProfessionalSpecialtyDto {
  id: string;
  name: string;
  isPrimary: boolean;
}

export interface RelatedProfessionalDto {
  id: string;
  displayName: string;
  slug: string;
  profileImageUrl: string | null;
  cityName: string | null;
  countryName: string | null;
  specialties: RelatedProfessionalSpecialtyDto[];
  yearsOfExperience: number | null;
  institutionSummary: string | null;
  hasAvailabilityToday: boolean | null;
}

export interface RelatedProfessionalsResponseDto {
  items: RelatedProfessionalDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MyAppointmentDetailRawDto {
  id?: string;
  professionalName?: string;
  placeName?: string;
  address?: string;
  appointmentDate?: string;
  timeSlot?: string;
  startUtc?: string;
  endUtc?: string;
  status?: number | string;
  statusDisplay?: string;
  reason?: string;
  observation?: string;
  consultationReason?: string;
  specialty?: string;
  specialtyName?: string;
  specialties?: Array<{
    id?: string;
    name?: string;
    specialtyId?: string;
    specialtyName?: string;
    isPrimary?: boolean;
  }>;
}

export interface MyAppointmentSpecialtyDto {
  id: string;
  name: string;
  isPrimary: boolean;
}

export interface MyAppointmentDetailDto {
  professionalName: string;
  placeName: string;
  address: string;
  appointmentDate: string;
  timeSlot: string;
  endTime: string;
  specialty: string;
  specialties: MyAppointmentSpecialtyDto[];
  consultationReason: string;
  startUtc: string;
  endUtc: string;
}

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
      .get<AppointmentsListRawDto>(`${this.baseUrl}/mine`, { params })
      .pipe(map((response) => this.mapAppointmentsList(response)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Create new appointment
   * POST /api/appointments/mine
   *
   * May return 422 with TIME_SLOT_UNAVAILABLE if slot is taken
   */
  createAppointment(
    dto: CreateAppointmentDto,
  ): Observable<CreateAppointmentResponseDto> {
    const appointmentDate = dto.appointmentDate ?? dto.date ?? '';
    const timeSlot = dto.timeSlot ?? dto.slotId ?? '';
    const observation = (dto.observation ?? dto.notes ?? '').trim();

    return this.http
      .post<CreateAppointmentResponseDto>(`${this.baseUrl}/mine`, {
        professionalProfileId: dto.professionalProfileId,
        appointmentDate,
        timeSlot,
        date: appointmentDate,
        slotId: dto.slotId,
        Observation: observation || undefined,
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Cancel appointment
   * POST /api/appointments/{id}/cancel
   */
  cancelAppointment(appointmentId: string): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/${appointmentId}/cancel`, null)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Get professionals related to my past appointments
   * GET /api/appointments/mine/professionals
   */
  getMyRelatedProfessionals(
    page = 1,
    pageSize = 10,
  ): Observable<RelatedProfessionalsResponseDto> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.http
      .get<RelatedProfessionalsResponseDto>(
        `${this.baseUrl}/mine/professionals`,
        {
          params,
        },
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Get my appointment detail by id
   * GET /api/appointments/mine/{id}
   */
  getMyAppointmentById(
    appointmentId: string,
  ): Observable<MyAppointmentDetailDto> {
    return this.http
      .get<MyAppointmentDetailRawDto>(`${this.baseUrl}/mine/${appointmentId}`)
      .pipe(map((response) => this.mapMyAppointmentDetail(response)))
      .pipe(catchError((error) => this.handleError(error)));
  }

  private mapAppointmentsList(
    response: AppointmentsListRawDto,
  ): AppointmentsListDto {
    const rawAppointments = response.items ?? response.appointments ?? [];
    return {
      appointments: rawAppointments.map((item) => this.mapAppointment(item)),
      total: response.total ?? response.count ?? rawAppointments.length,
      page: response.page ?? 1,
      pageSize: response.pageSize ?? rawAppointments.length,
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
      professionalProfileId:
        item?.professionalProfileId ??
        item?.professionalId ??
        item?.professional?.id ??
        '',
      date,
      startTime: time.startTime,
      endTime: time.endTime,
      status: normalizeAppointmentStatus(item?.status, item?.statusDisplay),
      notes: item?.notes,
      cancelReason: item?.cancelReason ?? item?.cancellationReason,
      professional: {
        id:
          item?.professional?.id ??
          item?.professionalProfileId ??
          item?.professionalId ??
          '',
        name:
          item?.professional?.name ?? item?.professionalName ?? 'Profesional',
        specialty: this.extractSpecialty(item),
        photoUrl: item?.professional?.photoUrl,
      },
      createdAt: item?.createdAt ?? new Date().toISOString(),
      updatedAt: item?.updatedAt ?? item?.createdAt ?? new Date().toISOString(),
    };
  }

  private mapMyAppointmentDetail(
    item: MyAppointmentDetailRawDto,
  ): MyAppointmentDetailDto {
    const appointmentDate = this.extractDate(item?.appointmentDate);
    const fallbackTime = this.extractTime(item?.startUtc);
    const specialties = this.extractDetailSpecialties(item);

    return {
      professionalName: item?.professionalName ?? 'Profesional',
      placeName: item?.placeName ?? 'Lugar por confirmar',
      address: item?.address ?? 'Dirección por confirmar',
      appointmentDate,
      timeSlot: item?.timeSlot ?? fallbackTime,
      endTime: this.extractTime(item?.endUtc),
      specialty:
        specialties.map((specialty) => specialty.name).join(', ') ||
        item?.specialty ||
        item?.specialtyName ||
        '',
      specialties,
      consultationReason:
        item?.consultationReason ?? item?.observation ?? item?.reason ?? '',
      startUtc: this.asText(item?.startUtc),
      endUtc: this.asText(item?.endUtc),
    };
  }

  private extractDate(rawDate: unknown): string {
    if (!rawDate) return '';
    const value = this.asText(rawDate);
    return value.includes('T') ? value.split('T')[0] : value;
  }

  private extractTimeRange(
    timeSlot: unknown,
    startTime: unknown,
    endTime: unknown,
  ): { startTime: string; endTime: string } {
    const slot = this.asText(timeSlot).trim();
    if (slot) {
      const slotRangeRegex = /(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/;
      const match = slotRangeRegex.exec(slot);
      if (match) {
        return {
          startTime: match[1],
          endTime: match[2],
        };
      }

      if (/^\d{1,2}:\d{2}$/.test(slot)) {
        return {
          startTime: slot,
          endTime: this.asText(endTime) || slot,
        };
      }
    }

    return {
      startTime: this.asText(startTime),
      endTime: this.asText(endTime),
    };
  }

  private extractTime(rawDateTime: unknown): string {
    if (!rawDateTime) return '';
    const value = this.asText(rawDateTime);
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private asText(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  }

  private extractSpecialty(item: any): string {
    // Scalar field on professional or top-level
    const scalar: string =
      item?.professional?.specialty || item?.specialtyName || '';
    if (scalar) return scalar;

    // Array on professional (e.g. professional.specialties[])
    const fromPro = (item?.professional?.specialties as Array<{ name?: string }> | undefined)
      ?.map((s) => s?.name)
      .filter(Boolean)
      .join(', ');
    if (fromPro) return fromPro;

    // Array on root item (e.g. specialties[])
    const fromRoot = (item?.specialties as Array<{ name?: string }> | undefined)
      ?.map((s) => s?.name)
      .filter(Boolean)
      .join(', ');
    return fromRoot ?? '';
  }

  private extractDetailSpecialties(
    item: MyAppointmentDetailRawDto,
  ): MyAppointmentSpecialtyDto[] {
    return (item?.specialties ?? [])
      .map((specialty) => ({
        id: specialty.id ?? specialty.specialtyId ?? specialty.name ?? '',
        name: specialty.name ?? specialty.specialtyName ?? '',
        isPrimary: specialty.isPrimary ?? false,
      }))
      .filter((specialty) => !!specialty.name.trim());
  }

  /**
   * Handle HTTP errors and convert to ApiError
   */
  private handleError(error: unknown): Observable<never> {
    const apiError: ApiError = createApiError(error);
    return throwError(() => apiError);
  }
}
