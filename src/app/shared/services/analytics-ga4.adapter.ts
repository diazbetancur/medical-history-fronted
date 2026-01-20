import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { environment } from '@env';
import {
  AnalyticsEventMap,
  AnalyticsEventName,
  AnalyticsProvider,
  PageViewData,
} from './analytics.types';

// Declare gtag for TypeScript
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Google Analytics 4 adapter implementation.
 * Handles all GA4-specific logic and gtag() calls.
 * SSR-safe: all operations are no-ops on server.
 */
@Injectable({ providedIn: 'root' })
export class GA4Adapter implements AnalyticsProvider {
  readonly name = 'ga4';

  private readonly platformId = inject(PLATFORM_ID);
  private initialized = false;

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private get config() {
    return environment.analytics;
  }

  /**
   * Initialize GA4 - only in browser and if enabled
   */
  initialize(): void {
    if (!this.isBrowser || this.initialized) return;
    if (!this.config?.enabled || this.config.provider !== 'ga4') return;

    const measurementId = this.config.measurementId;
    if (!measurementId) {
      console.warn('[GA4] No measurementId configured');
      return;
    }

    // Check if gtag is already loaded (from index.html)
    if (typeof window.gtag === 'function') {
      this.initialized = true;
      this.debugLog('GA4 initialized (script pre-loaded)');
      return;
    }

    // Dynamically load GA4 script if not pre-loaded
    this.loadScript(measurementId);
  }

  /**
   * Dynamically load GA4 script
   */
  private loadScript(measurementId: string): void {
    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false, // We handle page views manually
    });

    // Load the script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.onload = () => {
      this.initialized = true;
      this.debugLog('GA4 script loaded dynamically');
    };
    script.onerror = () => {
      console.error('[GA4] Failed to load gtag script');
    };
    document.head.appendChild(script);
  }

  /**
   * Track page view
   */
  trackPageView(data: PageViewData): void {
    if (!this.canTrack()) return;

    window.gtag('event', 'page_view', {
      page_path: data.path,
      page_title: data.title,
      page_location: window.location.href,
      is_ssr: data.isSSR,
    });

    this.debugLog('page_view', data);
  }

  /**
   * Track custom event
   */
  trackEvent<K extends AnalyticsEventName>(
    name: K,
    params: AnalyticsEventMap[K]
  ): void {
    if (!this.canTrack()) return;

    // Map our event names to GA4 event names if needed
    const ga4EventName = this.mapEventName(name);
    const ga4Params = this.mapEventParams(name, params);

    window.gtag('event', ga4EventName, ga4Params);

    this.debugLog(name, params);
  }

  /**
   * Set user ID for cross-device tracking
   */
  setUserId(userId: string | null): void {
    if (!this.canTrack()) return;

    window.gtag('config', this.config.measurementId!, {
      user_id: userId,
    });

    this.debugLog('setUserId', { userId });
  }

  /**
   * Set user properties
   */
  setUserProperties(
    properties: Record<string, string | number | boolean>
  ): void {
    if (!this.canTrack()) return;

    window.gtag('set', 'user_properties', properties);

    this.debugLog('setUserProperties', properties);
  }

  /**
   * Check if tracking is allowed
   */
  private canTrack(): boolean {
    if (!this.isBrowser) return false;
    if (!this.config?.enabled) return false;
    if (!this.initialized) {
      this.initialize();
      return this.initialized;
    }
    return typeof window.gtag === 'function';
  }

  /**
   * Map our event names to GA4 recommended event names
   */
  private mapEventName(name: AnalyticsEventName): string {
    const mapping: Record<AnalyticsEventName, string> = {
      page_view: 'page_view',
      view_search_results: 'view_search_results',
      view_profile: 'view_item', // GA4 recommended event
      click_contact: 'generate_lead', // GA4 recommended event
      submit_request: 'purchase', // Or 'generate_lead' depending on business model
      signup_professional: 'sign_up',
      profile_completed: 'tutorial_complete', // Or custom event
      // Service Request (Lead) events - custom events
      professional_view_requests: 'professional_view_requests',
      professional_update_request_status: 'professional_update_request_status',
      admin_view_requests: 'admin_view_requests',
      admin_reject_request: 'admin_reject_request',
    };
    return mapping[name] || name;
  }

  /**
   * Map our event params to GA4 format
   */
  private mapEventParams<K extends AnalyticsEventName>(
    name: K,
    params: AnalyticsEventMap[K]
  ): Record<string, unknown> {
    // Base params with our custom data
    const baseParams: Record<string, unknown> = { ...params };

    // Add GA4-specific mappings
    switch (name) {
      case 'view_profile':
        return {
          ...baseParams,
          item_id: (params as AnalyticsEventMap['view_profile']).professionalId,
          item_name: (params as AnalyticsEventMap['view_profile']).slug,
          item_category: (params as AnalyticsEventMap['view_profile']).category,
          item_location_id: (params as AnalyticsEventMap['view_profile']).city,
        };

      case 'click_contact':
        return {
          ...baseParams,
          contact_method: (params as AnalyticsEventMap['click_contact'])
            .channel,
          item_id: (params as AnalyticsEventMap['click_contact'])
            .professionalId,
        };

      case 'submit_request':
        return {
          ...baseParams,
          transaction_id: `req_${Date.now()}`,
          items: [
            {
              item_id: (params as AnalyticsEventMap['submit_request'])
                .professionalId,
              item_name: (params as AnalyticsEventMap['submit_request'])
                .serviceName,
            },
          ],
        };

      default:
        return baseParams;
    }
  }

  /**
   * Debug logging
   */
  private debugLog(event: string, data?: unknown): void {
    if (this.config?.debug) {
      console.log(`[GA4] ${event}`, data);
    }
  }
}
