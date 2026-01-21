import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Injectable,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { environment } from '@env';
import { distinctUntilChanged, filter, map } from 'rxjs';
import { GA4Adapter } from './analytics-ga4.adapter';
import {
  AnalyticsEventMap,
  AnalyticsEventName,
  AnalyticsProvider,
  ClickContactData,
  PageViewData,
  SubmitRequestData,
  ViewProfileData,
  ViewSearchResultsData,
} from './analytics.types';

/**
 * Core Analytics Service - Provider agnostic.
 *
 * Features:
 * - SSR-safe (no-op on server)
 * - Provider abstraction (GA4 default, easy to swap)
 * - Automatic page view tracking
 * - Typed event methods
 * - Duplicate prevention
 *
 * Usage:
 * - Inject and call typed methods
 * - Page views are automatic via router listener
 */
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly titleService = inject(Title);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ga4Adapter = inject(GA4Adapter);

  // Current provider (can be swapped at runtime if needed)
  private provider: AnalyticsProvider = this.ga4Adapter;

  // Track last events to prevent duplicates
  private readonly lastPageView = signal<string | null>(null);
  private readonly lastSearchEvent = signal<string | null>(null);
  private readonly lastProfileEvent = signal<string | null>(null);

  // SSR flag
  private readonly isSSR = !isPlatformBrowser(this.platformId);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private get config() {
    return environment.analytics;
  }

  private get isEnabled(): boolean {
    return this.config?.enabled && this.isBrowser;
  }

  /**
   * Initialize analytics - call once from app bootstrap
   */
  initialize(): void {
    if (!this.isEnabled) return;

    // Initialize provider
    this.provider.initialize();

    // Setup automatic page view tracking
    this.setupPageViewTracking();
  }

  /**
   * Setup automatic page view tracking on navigation
   */
  private setupPageViewTracking(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event) => (event as NavigationEnd).urlAfterRedirects),
        distinctUntilChanged(), // Prevent duplicates
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((url) => {
        // Small delay to ensure title is updated
        setTimeout(() => {
          this.trackPageView({
            path: url,
            title: this.titleService.getTitle(),
            isSSR: false, // We're in browser by this point
          });
        }, 0);
      });
  }

  // ==========================================================================
  // Core Tracking Methods
  // ==========================================================================

  /**
   * Track page view
   */
  trackPageView(data: PageViewData): void {
    if (!this.isEnabled) return;

    // Prevent duplicate page views
    const key = `${data.path}`;
    if (this.lastPageView() === key) return;
    this.lastPageView.set(key);

    this.provider.trackPageView(data);
  }

  /**
   * Track generic event (type-safe)
   */
  trackEvent<K extends AnalyticsEventName>(
    name: K,
    params: AnalyticsEventMap[K]
  ): void {
    if (!this.isEnabled) return;
    this.provider.trackEvent(name, params);
  }

  // ==========================================================================
  // Convenience Methods (typed shortcuts)
  // ==========================================================================

  /**
   * Track search results view - prevents duplicates
   */
  trackViewSearchResults(data: ViewSearchResultsData): void {
    if (!this.isEnabled) return;

    // Create unique key for this search
    const key = `${data.city || ''}-${data.category || ''}-${
      data.query || ''
    }-${data.page}`;
    if (this.lastSearchEvent() === key) return;
    this.lastSearchEvent.set(key);

    this.provider.trackEvent('view_search_results', data);
  }

  /**
   * Track profile view - prevents duplicates
   */
  trackViewProfile(data: ViewProfileData): void {
    if (!this.isEnabled) return;

    // Prevent duplicate tracking for same profile
    const key = data.professionalId;
    if (this.lastProfileEvent() === key) return;
    this.lastProfileEvent.set(key);

    this.provider.trackEvent('view_profile', data);
  }

  /**
   * Track contact click
   */
  trackClickContact(data: ClickContactData): void {
    if (!this.isEnabled) return;
    this.provider.trackEvent('click_contact', data);
  }

  /**
   * Track request submission
   */
  trackSubmitRequest(data: SubmitRequestData): void {
    if (!this.isEnabled) return;
    this.provider.trackEvent('submit_request', data);
  }

  /**
   * Track professional signup
   */
  trackSignupProfessional(method?: 'email' | 'google' | 'facebook'): void {
    if (!this.isEnabled) return;
    this.provider.trackEvent('signup_professional', { method });
  }

  /**
   * Track profile completion
   */
  trackProfileCompleted(
    professionalId: string,
    completionPercentage?: number
  ): void {
    if (!this.isEnabled) return;
    this.provider.trackEvent('profile_completed', {
      professionalId,
      completionPercentage,
    });
  }

  // ==========================================================================
  // User Methods
  // ==========================================================================

  /**
   * Set user ID for cross-device tracking
   */
  setUserId(userId: string | null): void {
    if (!this.isEnabled) return;
    this.provider.setUserId(userId);
  }

  /**
   * Set user properties
   */
  setUserProperties(
    properties: Record<string, string | number | boolean>
  ): void {
    if (!this.isEnabled) return;
    this.provider.setUserProperties(properties);
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Reset duplicate prevention (useful for testing)
   */
  resetDuplicatePrevention(): void {
    this.lastPageView.set(null);
    this.lastSearchEvent.set(null);
    this.lastProfileEvent.set(null);
  }

  /**
   * Change provider at runtime (for future migrations)
   */
  setProvider(provider: AnalyticsProvider): void {
    this.provider = provider;
    this.provider.initialize();
  }
}
