import { Injectable } from '@angular/core';

const CONTEXT_KEY = 'auth_current_context';

/**
 * Token storage stub — auth token is now managed as an httpOnly cookie by the
 * backend. This service is kept only to avoid breaking callers that have not
 * yet been migrated, but all token read/write operations are no-ops.
 *
 * The only localStorage item still owned here is `auth_current_context`,
 * which is a non-sensitive UI preference (which area is active).
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  setToken(_token: string, _expiresAt: string): void {
    // No-op: token lives in httpOnly cookie set by the backend
  }

  getToken(): string | null {
    return null; // httpOnly cookie is not readable from JS
  }

  hasValidToken(): boolean {
    return false; // AuthStore.initialize() no longer uses this check
  }

  isTokenExpired(): boolean {
    return true;
  }

  getTokenExpiry(): Date | null {
    return null;
  }

  clearToken(): void {
    // No-op: cookie is cleared via POST /api/auth/logout
  }
}

// Re-export the context key so AuthStore can use it directly
export { CONTEXT_KEY };
