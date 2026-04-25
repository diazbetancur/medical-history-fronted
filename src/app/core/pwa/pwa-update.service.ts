import { ApplicationRef, Injectable, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, first } from 'rxjs';
import { PlatformService } from '../platform/platform.service';

/**
 * PWA Update Service
 * Detects service worker updates and provides UI to activate them.
 * SSR-safe using PlatformService.
 */
@Injectable({ providedIn: 'root' })
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly platform = inject(PlatformService);
  private readonly appRef = inject(ApplicationRef);

  // ─── Signals ───────────────────────────────────────────────────────────────

  /** Whether a new version is available */
  readonly updateAvailable = signal(false);

  /** Whether SW is enabled */
  readonly isEnabled = signal(false);

  // ─── Initialization ────────────────────────────────────────────────────────

  /**
   * Initialize update detection.
   * Call this once from app.component or APP_INITIALIZER.
   */
  init(): void {
    this.platform.runInBrowser(() => {
      this.isEnabled.set(this.swUpdate.isEnabled);

      if (!this.swUpdate.isEnabled) {
        return;
      }

      this.listenForUpdates();
      this.checkForUpdatesOnStable();
    });
  }

  // ─── Public Methods ────────────────────────────────────────────────────────

  /**
   * Manually check for updates
   */
  async checkForUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) {
      return false;
    }

    try {
      return await this.swUpdate.checkForUpdate();
    } catch {
      return false;
    }
  }

  /**
   * Activate the new version and reload the page
   */
  async activateUpdate(): Promise<void> {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    try {
      await this.swUpdate.activateUpdate();
      this.platform.runInBrowser(() => {
        window.location.reload();
      });
    } catch (err) {
      // Force reload anyway
      this.platform.runInBrowser(() => {
        window.location.reload();
      });
    }
  }

  /**
   * Dismiss the update notification (user will see it next time)
   */
  dismissUpdate(): void {
    this.updateAvailable.set(false);
  }

  // ─── Private Methods ───────────────────────────────────────────────────────

  private listenForUpdates(): void {
    // Listen for version ready event
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
      )
      .subscribe(() => {
        this.updateAvailable.set(true);
      });

    // Handle unrecoverable state (corrupted SW)
    this.swUpdate.unrecoverable.subscribe(() => {
      // Force reload to get fresh content
      this.platform.runInBrowser(() => {
        window.location.reload();
      });
    });
  }

  private checkForUpdatesOnStable(): void {
    // Check for updates once the app is stable
    this.appRef.isStable.pipe(first((stable) => stable)).subscribe(() => {
      this.checkForUpdate();
    });

    // Also check periodically (every 6 hours)
    this.platform.runInBrowser(() => {
      const interval = 6 * 60 * 60 * 1000; // 6 hours
      setInterval(() => {
        this.checkForUpdate();
      }, interval);
    });
  }
}
