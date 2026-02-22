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
import { catchError, map, Observable, throwError } from 'rxjs';

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
      .get<any>(`${this.baseUrl}/history`, { params })
      .pipe(
        map(
          (response) =>
            ({
              items: (response?.items ?? []).map((item: any) => ({
                id: item.id,
                encounterDateUtc: item.visitDate ?? item.encounterDateUtc,
                status: 'Closed',
                professionalName: item.professionalName,
                summary: item.diagnosis ?? item.notes,
                notesCount: 0,
              })),
              totalCount: response?.total ?? response?.totalCount ?? 0,
              page: response?.page ?? page,
              pageSize: response?.pageSize ?? pageSize,
              totalPages:
                response?.totalPages ??
                Math.max(
                  1,
                  Math.ceil(
                    (response?.total ?? 0) / (response?.pageSize ?? pageSize),
                  ),
                ),
            }) as PatientHistoryResponseDto,
        ),
      )
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
      .get<any>(`${this.baseUrl}/history/${encounterId}`)
      .pipe(
        map(
          (item) =>
            ({
              id: item.id,
              patientProfileId: '',
              professionalProfileId: item.professionalProfileId,
              professionalName: item.professionalName,
              encounterDateUtc: item.visitDate ?? item.encounterDateUtc,
              summary: item.diagnosis ?? item.notes,
              status: 'Closed',
              notes: item.notes
                ? [
                    {
                      id: `${item.id}-note`,
                      type: 'Note',
                      text: item.notes,
                      createdAtUtc: item.dateCreated ?? item.visitDate,
                      createdByProfessionalProfileId:
                        item.professionalProfileId ?? '',
                      createdByProfessionalName: item.professionalName ?? '',
                    },
                  ]
                : [],
            }) as MedicalEncounterDto,
        ),
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Get patient privacy settings
   * GET /api/patient/privacy
   */
  getPrivacySettings(): Observable<PatientPrivacyDto> {
    return this.http
      .get<any>(`${this.baseUrl}/privacy`)
      .pipe(
        map(
          (response) =>
            ({
              shareFullHistoryWithTreatingProfessionals:
                response?.allowHistorySharing ??
                response?.shareFullHistoryWithTreatingProfessionals ??
                false,
            }) as PatientPrivacyDto,
        ),
      )
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
      .put<any>(`${this.baseUrl}/privacy`, {
        allowHistorySharing: dto.shareFullHistoryWithTreatingProfessionals,
        allowAnonymousResearch: false,
      })
      .pipe(
        map(
          () =>
            ({
              shareFullHistoryWithTreatingProfessionals:
                dto.shareFullHistoryWithTreatingProfessionals,
            }) as PatientPrivacyDto,
        ),
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Handle HTTP errors and convert to ApiError
   */
  private handleError(error: unknown): Observable<never> {
    return throwError(() => createApiError(error));
  }
}
