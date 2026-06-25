/**
 * Google Calendar Models
 *
 * Modelos para la sincronización con Google Calendar.
 */

/**
 * Response from GET /calendar/google/connect
 * Contains the OAuth authorization URL to redirect the user to.
 */
export interface GoogleCalendarConnectResponse {
  authorizationUrl: string;
  professionalProfileId: string;
  stateExpiresAtUtc: string;
}

/**
 * Calendar connection status from GET /calendar/connections
 */
export interface CalendarConnectionStatus {
  id: string;
  provider: string;
  calendarName: string;
  accountEmail?: string;
  lastSyncedAtUtc?: string;
  isActive: boolean;
  lastSyncError?: string;
}
