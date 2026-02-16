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
import { catchError, Observable, throwError } from 'rxjs';

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
      .get<PatientBackgroundResponseDto>(this.baseUrl)
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
      .post<BackgroundDto>(this.baseUrl, dto)
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
  update(id: number, dto: UpdateBackgroundDto): Observable<BackgroundDto> {
    return this.http
      .put<BackgroundDto>(`${this.baseUrl}/${id}`, dto)
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
  delete(id: number): Observable<void> {
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
