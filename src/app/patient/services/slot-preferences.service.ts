import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { AuthStore } from '@core/auth';

const SLOT_DURATION_PREFIX = 'appointment_slot_duration_minutes';
const DEFAULT_DURATION = 30;

@Injectable({ providedIn: 'root' })
export class SlotPreferencesService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authStore = inject(AuthStore);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getDurationMinutes(fallback = DEFAULT_DURATION): number {
    if (!this.isBrowser) return fallback;

    try {
      const raw = localStorage.getItem(this.getStorageKey());
      if (!raw) return fallback;
      const parsed = Number(raw);
      return Number.isInteger(parsed) && parsed >= 15 && parsed <= 480
        ? parsed
        : fallback;
    } catch {
      return fallback;
    }
  }

  setDurationMinutes(value: number): void {
    if (!this.isBrowser) return;
    if (!Number.isInteger(value) || value < 15 || value > 480) return;

    try {
      localStorage.setItem(this.getStorageKey(), String(value));
    } catch {
      // noop
    }
  }

  private getStorageKey(): string {
    const userId = this.authStore.user()?.id;
    return `${SLOT_DURATION_PREFIX}:${userId ?? 'guest'}`;
  }
}
