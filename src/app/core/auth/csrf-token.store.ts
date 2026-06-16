import { Injectable, signal } from '@angular/core';

/**
 * Holds the per-session anti-CSRF token in memory.
 *
 * The token is issued by the backend (embedded in the JWT's `csrf` claim and
 * returned in the body of /auth/login and /auth/me). It is intentionally NOT
 * persisted to localStorage/cookies: keeping it in memory only means it cannot
 * be read by another origin and is cleared on reload — where `loadMe()` fetches
 * a fresh one. The csrfInterceptor reads it and echoes it back in the
 * `X-XSRF-TOKEN` header on unsafe requests.
 */
@Injectable({ providedIn: 'root' })
export class CsrfTokenStore {
  private readonly _token = signal<string | null>(null);
  readonly token = this._token.asReadonly();

  set(token: string | null): void {
    this._token.set(token && token.length > 0 ? token : null);
  }

  clear(): void {
    this._token.set(null);
  }
}
