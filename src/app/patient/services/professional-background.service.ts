/**
 * Professional Background Service
 *
 * Handles read-only access to patient medical background (antecedentes)
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { createApiError } from '@core/http/api-error';
import { ProfessionalPatientBackgroundResponseDto } from '@data/models';
import { environment } from '@env';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProfessionalBackgroundService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/professional/patients`;

  // ==========================================================================
  // Read-Only Access to Patient Background
  // ==========================================================================

  /**
   * Get patient medical background (read-only, simple list)
   * GET /api/professional/patients/{patientProfileId}/background
   *
   * @param patientProfileId Patient Profile ID
   */
  getByPatient(
    patientProfileId: number,
  ): Observable<ProfessionalPatientBackgroundResponseDto> {
    return this.http
      .get<ProfessionalPatientBackgroundResponseDto>(
        `${this.baseUrl}/${patientProfileId}/background`,
      )
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
