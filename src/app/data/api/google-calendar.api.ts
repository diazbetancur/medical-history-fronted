import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import {
  CalendarBusyBlock,
  CalendarConnectionStatus,
  GoogleCalendarConnectResponse,
} from '../models/google-calendar.models';

/**
 * Google Calendar API Service
 *
 * Handles OAuth connect flow and calendar connection management.
 * Uses ApiClient which includes:
 * - X-Correlation-ID header (automatic)
 * - JWT authentication (automatic)
 * - ProblemDetails error handling (automatic)
 */
@Injectable({ providedIn: 'root' })
export class GoogleCalendarApi {
  private readonly api = inject(ApiClient);

  /**
   * Get the OAuth authorization URL to initiate Google Calendar connection.
   * Redirect the user to the returned authorizationUrl.
   */
  getConnectUrl(): Observable<GoogleCalendarConnectResponse> {
    return this.api.get<GoogleCalendarConnectResponse>(
      '/calendar/google/connect',
    );
  }

  /**
   * Get all active calendar connections for the authenticated professional.
   */
  getConnections(): Observable<CalendarConnectionStatus[]> {
    return this.api.get<CalendarConnectionStatus[]>('/calendar/connections');
  }

  /**
   * Disconnect (delete) a calendar connection by ID.
   */
  disconnect(id: string): Observable<void> {
    return this.api.delete<void>(`/calendar/connections/${id}`);
  }

  /**
   * Get busy blocks (external calendar events) for the authenticated professional
   * within the given ISO date range.
   * Returns an empty array on error (best-effort).
   */
  getBusyBlocks(fromIso: string, toIso: string): Observable<CalendarBusyBlock[]> {
    return this.api.get<CalendarBusyBlock[]>('/calendar/busy-blocks', {
      params: { from: fromIso, to: toIso },
    });
  }
}
