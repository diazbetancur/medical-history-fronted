import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

/**
 * Public application settings returned by the backend.
 * Safe to read without authentication.
 */
export interface AppSettingsDto {
  /** Default IANA timezone for the application (e.g. "America/Tegucigalpa") */
  defaultTimezone: string;
}

/**
 * App Settings API
 *
 * Reads public configuration from the backend at startup.
 * No authentication required.
 */
@Injectable({ providedIn: 'root' })
export class AppSettingsApi {
  private readonly api = inject(ApiClient);

  /**
   * Returns public application settings (e.g. default timezone).
   * Call this once at app init or lazily before the availability form is shown.
   */
  getAppSettings(): Observable<AppSettingsDto> {
    return this.api.get<AppSettingsDto>('/settings/app');
  }
}
