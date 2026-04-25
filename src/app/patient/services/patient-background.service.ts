/**
 * Patient Background Service
 *
 * Handles CRUD operations for patient's own medical background (antecedentes)
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { createApiError } from '@core/http/api-error';
import {
  BackgroundDto,
  CreateBackgroundDto,
  PatientBackgroundResponseDto,
  UpdateBackgroundDto,
} from '@data/models';
import { environment } from '@env';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PatientBackgroundService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/patients/me/background`;

  // ==========================================================================
  // Read Operations
  // ==========================================================================

  /**
   * Get my medical background (simple list, no pagination)
   * GET /api/patients/me/background
   */
  getMine(): Observable<PatientBackgroundResponseDto> {
    return this.http
      .get<any>(this.baseUrl, {
        params: {
          page: '1',
          pageSize: '50',
          activeOnly: 'true',
        },
      })
      .pipe(
        map(
          (response) =>
            ({
              items: (response?.items ?? []).map((item: any) => ({
                id: item.id,
                patientProfileId: '',
                type: item.type,
                title: item.typeName ?? item.type,
                description: item.description,
                eventDate: item.diagnosedYear
                  ? `${item.diagnosedYear}-01-01`
                  : null,
                isChronic: item.type === 'Chronic',
                isActive: item.isActive,
                createdAt: item.dateCreated,
                updatedAt: item.dateCreated,
              })),
              totalCount: response?.total ?? response?.totalCount ?? 0,
            }) as PatientBackgroundResponseDto,
        ),
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  // ==========================================================================
  // Create Operation
  // ==========================================================================

  /**
   * Create new background entry
   * POST /api/patients/me/background
   *
   * @param dto Background creation data
   */
  create(dto: CreateBackgroundDto): Observable<BackgroundDto> {
    return this.http
      .post<any>(this.baseUrl, {
        type: dto.type,
        description: dto.description || dto.title,
        diagnosedYear: dto.eventDate
          ? Number(dto.eventDate.slice(0, 4))
          : undefined,
        notes: dto.isChronic ? 'Crónico' : undefined,
      })
      .pipe(
        map(
          (item) =>
            ({
              id: item.id,
              patientProfileId: '',
              type: item.type,
              title: item.typeName ?? item.type,
              description: item.description,
              eventDate: item.diagnosedYear
                ? `${item.diagnosedYear}-01-01`
                : null,
              isChronic: item.type === 'Chronic',
              isActive: item.isActive,
              createdAt: item.dateCreated,
              updatedAt: item.dateCreated,
            }) as BackgroundDto,
        ),
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  // ==========================================================================
  // Update Operation
  // ==========================================================================

  /**
   * Update existing background entry
   * PUT /api/patients/me/background/{id}
   *
   * @param id Background ID
   * @param dto Update data
   */
  update(id: string, dto: UpdateBackgroundDto): Observable<BackgroundDto> {
    return this.http
      .put<any>(`${this.baseUrl}/${id}`, {
        type: dto.type,
        description: dto.description || dto.title,
        diagnosedYear: dto.eventDate
          ? Number(dto.eventDate.slice(0, 4))
          : undefined,
        notes: dto.isChronic ? 'Crónico' : undefined,
      })
      .pipe(
        map(
          (item) =>
            ({
              id: item.id,
              patientProfileId: '',
              type: item.type,
              title: item.typeName ?? item.type,
              description: item.description,
              eventDate: item.diagnosedYear
                ? `${item.diagnosedYear}-01-01`
                : null,
              isChronic: item.type === 'Chronic',
              isActive: item.isActive,
              createdAt: item.dateCreated,
              updatedAt: item.dateCreated,
            }) as BackgroundDto,
        ),
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  // ==========================================================================
  // Delete Operation (Soft Delete)
  // ==========================================================================

  /**
   * Soft delete background entry (sets isActive = false)
   * DELETE /api/patients/me/background/{id}
   *
   * @param id Background ID
   */
  delete(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // ==========================================================================
  // Error Handling
  // ==========================================================================

  private handleError(error: any): Observable<never> {
    const apiError = createApiError(error);
    return throwError(() => apiError);
  }
}
