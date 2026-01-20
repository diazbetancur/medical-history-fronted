import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';

/**
 * SSR-safe token storage service.
 * Only accesses localStorage in the browser.
 * Returns null values during SSR to avoid hydration mismatches.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Store JWT token and its expiry date
   */
  setToken(token: string, expiresAt: string): void {
    if (!this.isBrowser) return;

    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt);
    } catch (e) {
      console.warn('[TokenStorage] Failed to save token:', e);
    }
  }

  /**
   * Get stored JWT token
   * Returns null if not in browser, not found, or expired
   */
  getToken(): string | null {
    if (!this.isBrowser) return null;

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return null;

      // Check expiry
      if (this.isTokenExpired()) {
        this.clearToken();
        return null;
      }

      return token;
    } catch (e) {
      console.warn('[TokenStorage] Failed to read token:', e);
      return null;
    }
  }

  /**
   * Check if token exists and is valid (not expired)
   */
  hasValidToken(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    if (!this.isBrowser) return true;

    try {
      const expiresAt = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (!expiresAt) return true;

      const expiryDate = new Date(expiresAt);
      const now = new Date();

      // Add small buffer (30 seconds) to avoid edge cases
      return expiryDate.getTime() - 30000 < now.getTime();
    } catch (e) {
      return true;
    }
  }

  /**
   * Get token expiry date
   */
  getTokenExpiry(): Date | null {
    if (!this.isBrowser) return null;

    try {
      const expiresAt = localStorage.getItem(TOKEN_EXPIRY_KEY);
      return expiresAt ? new Date(expiresAt) : null;
    } catch {
      return null;
    }
  }

  /**
   * Clear stored token and expiry
   */
  clearToken(): void {
    if (!this.isBrowser) return;

    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
    } catch (e) {
      console.warn('[TokenStorage] Failed to clear token:', e);
    }
  }
}
