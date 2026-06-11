/**
 * Patient Service
 *
 * Handles patient profile API calls
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiError, createApiError } from '@core/http/api-error';
import { environment } from '@env';
import { catchError, Observable, throwError } from 'rxjs';
import {
  CreatePatientProfileDto,
  PatientProfileClaimCreatePayload,
  PatientProfileClaimCandidateDto,
  PatientProfileClaimRequestDto,
  PatientProfileDto,
  UpdatePatientProfileDto,
} from '../models/patient-profile.dto';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/patients`;

  /**
   * Get current patient profile
   * GET /api/patients/me
   *
   * Returns 404 if profile does not exist (new patient)
   */
  getMyProfile(): Observable<PatientProfileDto> {
    return this.http
      .get<PatientProfileDto>(`${this.baseUrl}/me`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Create patient profile (first time)
   * POST /api/patients/me
   */
  createProfile(dto: CreatePatientProfileDto): Observable<PatientProfileDto> {
    return this.http
      .post<PatientProfileDto>(`${this.baseUrl}/me`, dto)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Update patient profile
   * PUT /api/patients/me
   */
  updateProfile(dto: UpdatePatientProfileDto): Observable<PatientProfileDto> {
    return this.http
      .put<PatientProfileDto>(`${this.baseUrl}/me`, dto)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Get current user's patient profile claim requests.
   * GET /api/patients/me/claim-requests
   */
  getMyClaimRequests(): Observable<PatientProfileClaimRequestDto[]> {
    return this.http
      .get<PatientProfileClaimRequestDto[]>(`${this.baseUrl}/me/claim-requests`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Preview an external history candidate for the current document.
   * GET /api/patients/me/claim-requests/candidate
   */
  getCurrentDocumentClaimCandidate(): Observable<PatientProfileClaimCandidateDto | null> {
    return this.http
      .get<PatientProfileClaimCandidateDto | null>(
        `${this.baseUrl}/me/claim-requests/candidate`,
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Manually request a claim for the current document.
   * POST /api/patients/me/claim-requests/request-current-document
   */
  requestCurrentDocumentClaim(
    payload: PatientProfileClaimCreatePayload = {},
  ): Observable<PatientProfileClaimRequestDto> {
    return this.http
      .post<PatientProfileClaimRequestDto>(
        `${this.baseUrl}/me/claim-requests/request-current-document`,
        payload,
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Decline the current matching external history candidate.
   * POST /api/patients/me/claim-requests/decline-current-document
   */
  declineCurrentDocumentClaim(): Observable<PatientProfileClaimRequestDto | null> {
    return this.http
      .post<PatientProfileClaimRequestDto | null>(
        `${this.baseUrl}/me/claim-requests/decline-current-document`,
        {},
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Ask admin to cancel a pending claim request.
   * POST /api/patients/me/claim-requests/{id}/cancel
   */
  requestClaimCancellation(
    claimRequestId: string,
    reason?: string | null,
  ): Observable<PatientProfileClaimRequestDto> {
    return this.http
      .post<PatientProfileClaimRequestDto>(
        `${this.baseUrl}/me/claim-requests/${claimRequestId}/cancel`,
        { reason: reason ?? null },
      )
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
