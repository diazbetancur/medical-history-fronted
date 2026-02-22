/**
 * Slots Service
 *
 * Handles availability slots API calls
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiError, createApiError } from '@core/http/api-error';
import { environment } from '@env';
import { catchError, map, Observable, throwError } from 'rxjs';
import { SlotDto, SlotsResponseDto } from '../models/slot.dto';

interface SlotItemContract {
  startLocal: string;
  endLocal: string;
  startUtc: string;
  endUtc: string;
  professionalLocationId: string | null;
  professionalLocationName: string | null;
  professionalLocationAddress: string | null;
}

interface SlotsResponseContract {
  date: string;
  timeZone: string;
  slotMinutes: number;
  totalSlots: number;
  items: SlotItemContract[];
}

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
    durationMinutes = 30,
  ): Observable<SlotsResponseDto> {
    const params = new HttpParams()
      .set('date', date)
      .set('durationMinutes', String(durationMinutes));

    return this.http
      .get<SlotsResponseContract>(
        `${this.baseUrl}/professional/${professionalProfileId}/availability/slots`,
        { params },
      )
      .pipe(
        map((response) =>
          this.mapSlotsResponse(response, professionalProfileId),
        ),
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  private mapSlotsResponse(
    response: SlotsResponseContract,
    professionalProfileId: string,
  ): SlotsResponseDto {
    const slots: SlotDto[] = (response.items ?? []).map((item) => ({
      id: item.startUtc,
      startTime: item.startLocal,
      endTime: item.endLocal,
      startUtc: item.startUtc,
      endUtc: item.endUtc,
      isAvailable: true,
      professionalProfileId,
      professionalLocationId: item.professionalLocationId,
      professionalLocationName: item.professionalLocationName,
      professionalLocationAddress: item.professionalLocationAddress,
    }));

    return {
      date: response.date,
      timeZone: response.timeZone,
      slotMinutes: response.slotMinutes,
      totalSlots: response.totalSlots,
      slots,
      professionalProfileId,
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
