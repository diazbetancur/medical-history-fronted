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

    return this.http
      .post<CreateAppointmentResponseDto>(`${this.baseUrl}/mine`, {
        professionalProfileId: dto.professionalProfileId,
        appointmentDate,
        timeSlot,
        date: appointmentDate,
        slotId: dto.slotId,
        notes: dto.notes,
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
        specialty:
          item?.professional?.specialty ??
          item?.specialtyName ??
          'Especialidad',
        photoUrl: item?.professional?.photoUrl,
      },
      createdAt: item?.createdAt ?? new Date().toISOString(),
      updatedAt: item?.updatedAt ?? item?.createdAt ?? new Date().toISOString(),
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

  /**
   * Handle HTTP errors and convert to ApiError
   */
  private handleError(error: unknown): Observable<never> {
    const apiError: ApiError = createApiError(error);
    return throwError(() => apiError);
  }
}
