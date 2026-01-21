/**
 * Analytics types and interfaces
 * Defines the contract for all analytics events and providers
 */

// =============================================================================
// Event Types
// =============================================================================

export interface PageViewData {
  path: string;
  title: string;
  isSSR: boolean;
}

export interface ViewSearchResultsData {
  city?: string;
  category?: string;
  query?: string;
  page: number;
  totalResults: number;
}

export interface ViewProfileData {
  professionalId: string;
  slug: string;
  city: string;
  category: string;
}

export interface ClickContactData {
  professionalId: string;
  channel: 'whatsapp' | 'phone' | 'form';
  professionalName?: string;
}

export interface SubmitRequestData {
  professionalId: string;
  professionalSlug?: string;
  serviceId?: string;
  serviceName?: string;
  requestId?: string;
}

export interface SignupProfessionalData {
  method?: 'email' | 'google' | 'facebook';
}

export interface ProfileCompletedData {
  professionalId: string;
  completionPercentage?: number;
}

// Service Request (Lead) Flow Events
export interface ProfessionalViewRequestsData {
  pendingCount: number;
  totalCount: number;
}

export interface ProfessionalUpdateRequestStatusData {
  requestId: string;
  previousStatus: string;
  newStatus: string;
}

export interface AdminViewRequestsData {
  pendingCount: number;
  totalCount: number;
}

export interface AdminRejectRequestData {
  requestId: string;
  professionalId: string;
  previousStatus: string;
}

// =============================================================================
// Event Names (type-safe)
// =============================================================================

export type AnalyticsEventName =
  | 'page_view'
  | 'view_search_results'
  | 'view_profile'
  | 'click_contact'
  | 'submit_request'
  | 'signup_professional'
  | 'profile_completed'
  // Service Request (Lead) events
  | 'professional_view_requests'
  | 'professional_update_request_status'
  | 'admin_view_requests'
  | 'admin_reject_request';

// =============================================================================
// Event Params Map
// =============================================================================

export interface AnalyticsEventMap {
  page_view: PageViewData;
  view_search_results: ViewSearchResultsData;
  view_profile: ViewProfileData;
  click_contact: ClickContactData;
  submit_request: SubmitRequestData;
  signup_professional: SignupProfessionalData;
  profile_completed: ProfileCompletedData;
  // Service Request (Lead) events
  professional_view_requests: ProfessionalViewRequestsData;
  professional_update_request_status: ProfessionalUpdateRequestStatusData;
  admin_view_requests: AdminViewRequestsData;
  admin_reject_request: AdminRejectRequestData;
}

// =============================================================================
// Provider Interface
// =============================================================================

export interface AnalyticsProvider {
  readonly name: string;
  initialize(): void;
  trackPageView(data: PageViewData): void;
  trackEvent<K extends AnalyticsEventName>(
    name: K,
    params: AnalyticsEventMap[K]
  ): void;
  setUserId(userId: string | null): void;
  setUserProperties(
    properties: Record<string, string | number | boolean>
  ): void;
}

// =============================================================================
// Configuration
// =============================================================================

export type AnalyticsProviderType =
  | 'ga4'
  | 'plausible'
  | 'umami'
  | 'mixpanel'
  | 'none';

export interface AnalyticsConfig {
  enabled: boolean;
  provider: AnalyticsProviderType;
  measurementId?: string; // GA4
  debug?: boolean;
}
