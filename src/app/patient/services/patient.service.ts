/**
 * Patient Service
 *
 * Handles patient profile API calls
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthStore } from '@core/auth';
import { ApiError, createApiError } from '@core/http/api-error';
import { environment } from '@env';
import { catchError, Observable, throwError } from 'rxjs';
import {
  CreatePatientProfileDto,
  PatientProfileDto,
  UpdatePatientProfileDto,
} from '../models/patient-profile.dto';

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);
  private readonly baseUrl = `${environment.apiBaseUrl}/patients`;

  private getIdentityPayload(): { email?: string; fullName?: string } {
    const user = this.authStore.user();
    return {
      email: user?.email,
      fullName: user?.name,
    };
  }

  /**
   * Get current patient profile
   * GET /api/patients/me
   *
   * Returns 404 if profile does not exist (new patient)
   */
  getMyProfile(): Observable<PatientProfileDto> {
    const identity = this.getIdentityPayload();
    return this.http
      .get<PatientProfileDto>(`${this.baseUrl}/me`, {
        params: {
          ...(identity.email ? { email: identity.email } : {}),
          ...(identity.fullName ? { fullName: identity.fullName } : {}),
        },
      })
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Create patient profile (first time)
   * POST /api/patients/me
   */
  createProfile(dto: CreatePatientProfileDto): Observable<PatientProfileDto> {
    const identity = this.getIdentityPayload();
    const payload = {
      ...dto,
      ...(identity.email ? { email: identity.email } : {}),
      ...(identity.fullName ? { fullName: identity.fullName } : {}),
    };

    return this.http
      .post<PatientProfileDto>(`${this.baseUrl}/me`, payload)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Update patient profile
   * PUT /api/patients/me
   */
  updateProfile(dto: UpdatePatientProfileDto): Observable<PatientProfileDto> {
    const identity = this.getIdentityPayload();
    const payload = {
      ...dto,
      ...(identity.email ? { email: identity.email } : {}),
      ...(identity.fullName ? { fullName: identity.fullName } : {}),
    };

    return this.http
      .put<PatientProfileDto>(`${this.baseUrl}/me`, payload)
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
