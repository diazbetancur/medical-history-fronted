/**
 * Slots Service
 *
 * Handles availability slots API calls
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiError, createApiError } from '@core/http/api-error';
import { environment } from '@env';
import { catchError, Observable, throwError } from 'rxjs';
import { SlotsResponseDto } from '../models/slot.dto';

@Injectable({
  providedIn: 'root',
})
export class SlotsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * Get available slots for a professional on a specific date
   * GET /api/professional/{professionalProfileId}/availability/slots?date=YYYY-MM-DD
   */
  getSlots(
    professionalProfileId: string,
    date: string,
  ): Observable<SlotsResponseDto> {
    const params = new HttpParams().set('date', date);

    return this.http
      .get<SlotsResponseDto>(
        `${this.baseUrl}/professional/${professionalProfileId}/availability/slots`,
        { params },
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
