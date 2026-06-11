import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { createApiError } from '@core/http/api-error';
import { environment } from '@env';
import { catchError, Observable, throwError } from 'rxjs';
import type { PatientClinicalAccessRequestDto } from '../../features/professional/services/professional-patients.service';

@Injectable({
  providedIn: 'root',
})
export class PatientAccessRequestsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/patient/access-requests`;

  listMine(): Observable<PatientClinicalAccessRequestDto[]> {
    return this.http
      .get<PatientClinicalAccessRequestDto[]>(this.baseUrl)
      .pipe(catchError((error) => this.handleError(error)));
  }

  approve(requestId: string): Observable<PatientClinicalAccessRequestDto> {
    return this.http
      .post<PatientClinicalAccessRequestDto>(
        `${this.baseUrl}/${requestId}/approve`,
        {},
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  reject(requestId: string): Observable<PatientClinicalAccessRequestDto> {
    return this.http
      .post<PatientClinicalAccessRequestDto>(
        `${this.baseUrl}/${requestId}/reject`,
        {},
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  revokeProfessional(
    professionalProfileId: string,
  ): Observable<PatientClinicalAccessRequestDto> {
    return this.http
      .post<PatientClinicalAccessRequestDto>(
        `${this.baseUrl}/professionals/${professionalProfileId}/revoke`,
        {},
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  private handleError(error: unknown): Observable<never> {
    return throwError(() => createApiError(error));
  }
}
