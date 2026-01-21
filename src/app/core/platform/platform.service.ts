import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

/**
 * Helper service for SSR-safe platform detection.
 * Use this instead of directly accessing window/document.
 */
@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly platformId = inject(PLATFORM_ID);

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  get isServer(): boolean {
    return isPlatformServer(this.platformId);
  }

  /**
   * Execute a function only in browser context
   */
  runInBrowser<T>(fn: () => T): T | null {
    if (this.isBrowser) {
      return fn();
    }
    return null;
  }

  /**
   * Get window object safely (returns null on server)
   */
  getWindow(): Window | null {
    return this.isBrowser ? window : null;
  }

  /**
   * Get document object safely (returns null on server)
   */
  getDocument(): Document | null {
    return this.isBrowser ? document : null;
  }

  /**
   * Get localStorage safely (returns null on server)
   */
  getLocalStorage(): Storage | null {
    return this.isBrowser ? localStorage : null;
  }

  /**
   * Get sessionStorage safely (returns null on server)
   */
  getSessionStorage(): Storage | null {
    return this.isBrowser ? sessionStorage : null;
  }
}
