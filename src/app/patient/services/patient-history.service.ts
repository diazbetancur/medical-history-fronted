/**
 * Patient History Service
 *
 * Handles patient's own medical history viewing
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { createApiError } from '@core/http/api-error';
import {
  MedicalEncounterDto,
  PatientHistoryResponseDto,
  PatientPrivacyDto,
  UpdatePatientPrivacyDto,
} from '@data/models';
import { environment } from '@env';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PatientHistoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/patient`;

  /**
   * Get patient's own medical history (paginated)
   * GET /api/patient/history
   *
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   */
  getHistoryList(
    page: number = 1,
    pageSize: number = 10,
  ): Observable<PatientHistoryResponseDto> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http
      .get<PatientHistoryResponseDto>(`${this.baseUrl}/history`, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Get single encounter detail
   * GET /api/patient/history/{id}
   *
   * @param encounterId Encounter ID
   */
  getHistoryDetail(encounterId: string): Observable<MedicalEncounterDto> {
    return this.http
      .get<MedicalEncounterDto>(`${this.baseUrl}/history/${encounterId}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Get patient privacy settings
   * GET /api/patient/privacy
   */
  getPrivacySettings(): Observable<PatientPrivacyDto> {
    return this.http
      .get<PatientPrivacyDto>(`${this.baseUrl}/privacy`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Update patient privacy settings
   * PUT /api/patient/privacy
   *
   * @param dto Privacy settings to update
   */
  updatePrivacySettings(
    dto: UpdatePatientPrivacyDto,
  ): Observable<PatientPrivacyDto> {
    return this.http
      .put<PatientPrivacyDto>(`${this.baseUrl}/privacy`, dto)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Handle HTTP errors and convert to ApiError
   */
  private handleError(error: unknown): Observable<never> {
    return throwError(() => createApiError(error));
  }
}
