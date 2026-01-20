import { Injectable, inject, signal } from '@angular/core';
import { PlatformService } from '../platform/platform.service';

/**
 * BeforeInstallPromptEvent interface
 * Chrome/Edge specific event for PWA install prompt
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  prompt(): Promise<void>;
}

/** Storage key for dismissal timestamp */
const INSTALL_DISMISSED_KEY = 'pwa_install_dismissed_at';

/** Default cooldown period (24 hours in milliseconds) */
const DEFAULT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

/**
 * PWA Install Service
 * Handles install prompt for Chrome/Android and iOS detection.
 * SSR-safe using PlatformService.
 */
@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private readonly platform = inject(PlatformService);

  /** The deferred install prompt event (Chrome/Edge) */
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  /** Cooldown period in ms (configurable) */
  private cooldownMs = DEFAULT_COOLDOWN_MS;

  // ─── Signals ───────────────────────────────────────────────────────────────

  /** Whether the app can be installed (Chrome prompt available) */
  readonly canInstall = signal(false);

  /** Whether running on iOS Safari (needs manual install guide) */
  readonly isIOS = signal(false);

  /** Whether app is already installed as PWA */
  readonly isInstalled = signal(false);

  /** Whether prompt was recently dismissed (within cooldown) */
  readonly isDismissed = signal(false);

  /** Whether to show any install UI */
  readonly shouldShowInstallUI = signal(false);

  // ─── Initialization ────────────────────────────────────────────────────────

  /**
   * Initialize PWA install detection.
   * Call this once from app.component or APP_INITIALIZER.
   */
  init(cooldownMs = DEFAULT_COOLDOWN_MS): void {
    this.cooldownMs = cooldownMs;

    this.platform.runInBrowser(() => {
      this.detectPlatform();
      this.checkIfInstalled();
      this.checkDismissalCooldown();
      this.listenForInstallPrompt();
      this.updateShouldShowUI();
    });
  }

  // ─── Public Methods ────────────────────────────────────────────────────────

  /**
   * Trigger the native install prompt (Chrome/Edge only)
   */
  async promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferredPrompt) {
      return 'unavailable';
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        this.canInstall.set(false);
        this.isInstalled.set(true);
      } else {
        this.recordDismissal();
      }

      this.deferredPrompt = null;
      this.updateShouldShowUI();
      return outcome;
    } catch {
      return 'unavailable';
    }
  }

  /**
   * User dismissed the install UI (for iOS guide or custom prompt)
   */
  dismissInstallUI(): void {
    this.recordDismissal();
    this.updateShouldShowUI();
  }

  /**
   * Reset dismissal (for testing or settings)
   */
  resetDismissal(): void {
    const storage = this.platform.getLocalStorage();
    storage?.removeItem(INSTALL_DISMISSED_KEY);
    this.isDismissed.set(false);
    this.updateShouldShowUI();
  }

  // ─── Private Methods ───────────────────────────────────────────────────────

  private detectPlatform(): void {
    const win = this.platform.getWindow();
    if (!win) return;

    const ua = win.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (win.navigator.platform === 'MacIntel' &&
        win.navigator.maxTouchPoints > 1);

    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios|edgios/.test(ua);

    // iOS Safari (not in standalone mode)
    this.isIOS.set(isIOSDevice && isSafari);
  }

  private checkIfInstalled(): void {
    const win = this.platform.getWindow();
    if (!win) return;

    // Check display-mode media query
    const isStandalone =
      win.matchMedia('(display-mode: standalone)').matches ||
      win.matchMedia('(display-mode: fullscreen)').matches ||
      // iOS Safari standalone mode
      (win.navigator as { standalone?: boolean }).standalone === true;

    this.isInstalled.set(isStandalone);
  }

  private checkDismissalCooldown(): void {
    const storage = this.platform.getLocalStorage();
    if (!storage) return;

    const dismissedAt = storage.getItem(INSTALL_DISMISSED_KEY);
    if (!dismissedAt) {
      this.isDismissed.set(false);
      return;
    }

    const dismissedTime = parseInt(dismissedAt, 10);
    const now = Date.now();
    const withinCooldown = now - dismissedTime < this.cooldownMs;

    this.isDismissed.set(withinCooldown);
  }

  private recordDismissal(): void {
    const storage = this.platform.getLocalStorage();
    storage?.setItem(INSTALL_DISMISSED_KEY, Date.now().toString());
    this.isDismissed.set(true);
  }

  private listenForInstallPrompt(): void {
    const win = this.platform.getWindow();
    if (!win) return;

    win.addEventListener('beforeinstallprompt', (e: Event) => {
      // Prevent Chrome's mini-infobar
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      this.canInstall.set(true);
      this.updateShouldShowUI();
    });

    // Listen for successful installation
    win.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.canInstall.set(false);
      this.isInstalled.set(true);
      this.updateShouldShowUI();
    });
  }

  private updateShouldShowUI(): void {
    // Don't show if already installed
    if (this.isInstalled()) {
      this.shouldShowInstallUI.set(false);
      return;
    }

    // Don't show if recently dismissed
    if (this.isDismissed()) {
      this.shouldShowInstallUI.set(false);
      return;
    }

    // Show if Chrome prompt is available OR if iOS Safari
    const shouldShow = this.canInstall() || this.isIOS();
    this.shouldShowInstallUI.set(shouldShow);
  }
}
