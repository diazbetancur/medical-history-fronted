/**
 * API Models - Typed interfaces matching the API contract
 * Source of truth: api-contract.md
 *
 * NOTE: For role-related types and utilities, use src/app/shared/auth/roles.ts
 * The UserRole type here is kept for API compatibility but should reference
 * the centralized roles module for any role logic.
 */

// =============================================================================
// Auth Models
// =============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    userName: string;
    roles: string[]; // Dynamic array - can receive any roles from API
  };
}

export interface UserSession {
  userId: string;
  userName: string;
  email: string;
  roles: string[]; // Dynamic array - handles unknown roles gracefully
  hasProfessionalProfile: boolean;
  professionalProfileId: string | null;
  professionalProfileSlug: string | null;
  /**
   * Optional permissions for future fine-grained access control.
   * Will be populated when backend implements permission system.
   */
  permissions?: string[];
}

/**
 * Known user roles. API may return additional roles not listed here.
 * For role utilities and constants, use '@shared/auth/roles'.
 */
export type UserRole = 'Client' | 'Professional' | 'Admin' | 'SuperAdmin';

// =============================================================================
// Pagination Models
// =============================================================================

export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// =============================================================================
// SEO Models
// =============================================================================

export interface SeoMeta {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
}

// =============================================================================
// Catalog Models (Metadata)
// =============================================================================

export interface Country {
  id: string;
  name: string;
  iso2?: string;
  slug: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  countryId: string;
  stateRegion?: string;
  countryName?: string;
  countrySlug?: string;
  professionalCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  professionalCount?: number;
}

export interface MetadataResponse {
  countries: Country[];
  cities: City[];
  categories: Category[];
}

// =============================================================================
// Public Pages Models
// =============================================================================

export interface FeaturedCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  professionalCount?: number;
}

export interface FeaturedProfessional {
  id: string;
  slug: string;
  businessName: string;
  profileImageUrl?: string;
  categoryName: string;
  categorySlug: string;
  cityName: string;
  citySlug: string;
  isVerified: boolean;
  isFeatured: boolean;
  priceFrom?: number;
}

export interface PopularCity {
  id: string;
  name: string;
  slug: string;
  stateRegion?: string;
  countryName?: string;
  countrySlug?: string;
  professionalCount?: number;
}

export interface HomePageTotals {
  totalProfessionals: number;
  totalCategories: number;
  totalCities: number;
}

export interface HomePageResponse {
  featuredCategories: FeaturedCategory[];
  featuredProfessionals: FeaturedProfessional[];
  popularCities: PopularCity[];
  totals: HomePageTotals;
  seo: SeoMeta;
}

// =============================================================================
// Search Models
// =============================================================================

export interface SearchParams {
  q?: string;
  category?: string;
  city?: string;
  country?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchProfessional {
  id: string;
  slug: string;
  businessName: string;
  profileImageUrl?: string;
  categoryName: string;
  categorySlug: string;
  cityName: string;
  citySlug: string;
  isVerified: boolean;
  isFeatured: boolean;
  priceFrom?: number;
}

export interface SearchFilterItem {
  slug: string;
  name: string;
  count: number;
}

export interface SearchFilters {
  categories: SearchFilterItem[];
  cities: SearchFilterItem[];
  priceRange: { min: number; max: number };
}

export interface AppliedFilters {
  category: string | null;
  city: string | null;
  q: string | null;
}

export interface SearchPageResponse {
  professionals: SearchProfessional[];
  pagination: PaginationMeta;
  filters: SearchFilters;
  appliedFilters: AppliedFilters;
  seo: SeoMeta;
}

// =============================================================================
// Profile Detail Models
// =============================================================================

export interface ProfileDetail {
  id: string;
  slug: string;
  businessName: string;
  description?: string;
  phone?: string;
  whatsApp?: string;
  email?: string;
  address?: string;
  profileImageUrl?: string;
  isVerified: boolean;
  isFeatured: boolean;
  viewCount: number;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  countryId: string;
  countryName: string;
  cityId: string;
  cityName: string;
  citySlug: string;
  dateCreated: string;
  dateUpdated?: string;
}

export interface ProfileService {
  id: string;
  profileId: string;
  name: string;
  description?: string;
  priceFrom?: number;
  priceTo?: number;
  duration?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface RelatedProfessional {
  id: string;
  slug: string;
  businessName: string;
  profileImageUrl?: string;
  categoryName: string;
  categorySlug: string;
  cityName: string;
  citySlug: string;
  isVerified: boolean;
  isFeatured: boolean;
  priceFrom?: number;
}

export interface ProfilePageResponse {
  profile: ProfileDetail;
  services: ProfileService[];
  relatedProfessionals: RelatedProfessional[];
  seo: SeoMeta;
}

// =============================================================================
// Suggest (Typeahead) Models
// =============================================================================

export interface SuggestProfessional {
  id: string;
  slug: string;
  businessName: string;
  categoryName: string;
  cityName: string;
}

export interface SuggestCategory {
  slug: string;
  name: string;
  icon?: string;
}

export interface SuggestService {
  name: string;
  professionalSlug: string;
  professionalName: string;
}

export interface SuggestResponse {
  professionals: SuggestProfessional[];
  categories: SuggestCategory[];
  services: SuggestService[];
}

// =============================================================================
// Service Request Models (Public)
// =============================================================================

export interface CreateServiceRequestPayload {
  profileId: string;
  serviceId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  message: string;
}

export interface CreateServiceRequestResponse {
  id: string;
  profileId: string;
  status: RequestStatus;
  dateCreated: string;
  message: string;
}

// =============================================================================
// Professional Profile Models
// =============================================================================

export interface ProfessionalProfile {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  description?: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  cityId: string;
  cityName: string;
  countryId: string;
  countryName: string;
  phone?: string;
  whatsApp?: string;
  email?: string;
  address?: string;
  profileImageUrl?: string;
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  viewCount: number;
  dateCreated: string;
  dateUpdated?: string;
  servicesCount: number;
}

export interface CreateProfessionalProfilePayload {
  businessName: string;
  slug?: string;
  description?: string;
  categoryId: string;
  cityId: string;
  countryId: string;
  phone?: string;
  whatsApp?: string;
  email?: string;
  address?: string;
  profileImageUrl?: string;
}

export interface UpdateProfessionalProfilePayload {
  businessName?: string;
  description?: string;
  categoryId?: string;
  cityId?: string;
  countryId?: string;
  phone?: string;
  whatsApp?: string;
  email?: string;
  address?: string;
  profileImageUrl?: string;
}

// =============================================================================
// Professional Services Models
// =============================================================================

export interface Service {
  id: string;
  profileId: string;
  name: string;
  description?: string;
  priceFrom?: number;
  priceTo?: number;
  duration?: string;
  isActive: boolean;
  sortOrder: number;
  dateCreated: string;
  dateUpdated?: string;
}

export interface CreateServicePayload {
  name: string;
  description?: string;
  priceFrom?: number;
  priceTo?: number;
  duration?: string;
  sortOrder?: number;
}

export interface UpdateServicePayload {
  name?: string;
  description?: string;
  priceFrom?: number;
  priceTo?: number;
  duration?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// =============================================================================
// Service Request Models (Professional & Admin)
// =============================================================================

export type RequestStatus =
  | 'Pending'
  | 'Contacted'
  | 'InProgress'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled';

export interface ServiceRequest {
  id: string;
  profileId: string;
  serviceId?: string;
  serviceName?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  message: string;
  status: RequestStatus;
  statusName: string;
  professionalNotes?: string;
  adminNotes?: string;
  dateCreated: string;
  dateUpdated?: string;
}

export interface ProfessionalRequestsParams {
  page?: number;
  pageSize?: number;
  status?: RequestStatus;
  from?: string;
  to?: string;
}

export interface ProfessionalRequestsResponse
  extends PaginatedResponse<ServiceRequest> {}

export interface UpdateRequestStatusPayload {
  status: RequestStatus;
  professionalNotes?: string;
}

export interface UpdateRequestResponse {
  id: string;
  status: RequestStatus;
  professionalNotes?: string;
  dateUpdated: string;
}

// =============================================================================
// Admin Models
// =============================================================================

export interface AdminProfessionalsParams {
  status?: 'pending' | 'active' | 'disabled' | 'all';
  countryId?: string;
  cityId?: string;
  categoryId?: string;
  q?: string;
  orderBy?: 'dateCreated' | 'businessName';
  page?: number;
  pageSize?: number;
}

export interface AdminProfessionalListItem {
  id: string;
  userId: string;
  slug: string;
  businessName: string;
  countryId: string;
  countryName: string;
  cityId: string;
  cityName: string;
  categoryId: string;
  categoryName: string;
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  viewCount: number;
  servicesCount: number;
  adminNotes?: string;
  dateCreated: string;
  dateUpdated?: string;
  email?: string;
  phone?: string;
}

export interface AdminProfessionalsResponse
  extends PaginatedResponse<AdminProfessionalListItem> {}

export interface AdminProfessionalDetail extends AdminProfessionalListItem {
  description?: string;
  whatsApp?: string;
  address?: string;
  profileImageUrl?: string;
  services: Service[];
  requestCountsByStatus: Record<RequestStatus, number>;
}

export interface ModerateProfilePayload {
  isActive?: boolean;
  isVerified?: boolean;
  isFeatured?: boolean;
  adminNotes?: string;
}

export interface ModerateProfileResponse {
  id: string;
  isActive: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  adminNotes?: string;
  dateUpdated: string;
}

export interface ModerateServicePayload {
  isActive?: boolean;
  sortOrder?: number;
}

export interface AdminRequestListItem extends ServiceRequest {
  profileBusinessName: string;
  profileSlug: string;
  profileUserId: string;
}

export interface AdminRequestsParams {
  page?: number;
  pageSize?: number;
  status?: RequestStatus;
  from?: string;
  to?: string;
}

export interface AdminRequestsResponse
  extends PaginatedResponse<AdminRequestListItem> {}

export interface ModerateRequestPayload {
  status?: 'Rejected';
  adminNotes?: string;
}

export interface ModerateRequestResponse {
  id: string;
  status: RequestStatus;
  adminNotes?: string;
  dateUpdated: string;
}

export interface AdminCatalogsResponse {
  countries: Array<Country & { isActive: boolean; citiesCount: number }>;
  cities: Array<
    City & { countryName: string; isActive: boolean; profilesCount: number }
  >;
  categories: Array<
    Category & { sortOrder: number; isActive: boolean; profilesCount: number }
  >;
}

// =============================================================================
// Error Models (ProblemDetails RFC 7807)
// =============================================================================

export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

export interface SimpleError {
  message: string;
}

export type ApiError = ProblemDetails | SimpleError;

/**
 * Type guard to check if error is ProblemDetails
 */
export function isProblemDetails(error: unknown): error is ProblemDetails {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'title' in error
  );
}

/**
 * Type guard to check if error has field errors
 */
export function hasFieldErrors(
  error: unknown
): error is ProblemDetails & { errors: Record<string, string[]> } {
  return (
    isProblemDetails(error) &&
    !!error.errors &&
    Object.keys(error.errors).length > 0
  );
}

/**
 * Extract first error message from ProblemDetails or simple error
 */
export function getErrorMessage(error: unknown): string {
  if (isProblemDetails(error)) {
    if (error.detail) return error.detail;
    if (error.errors) {
      const firstField = Object.keys(error.errors)[0];
      if (firstField && error.errors[firstField]?.[0]) {
        return error.errors[firstField][0];
      }
    }
    return error.title;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return (error as SimpleError).message;
  }
  return 'Ha ocurrido un error inesperado';
}
