/**
 * Models for public pages API responses
 * Each endpoint returns a "bundled" response with all data needed for the page
 */

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
// Home Page Models
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
  name: string;
  slug: string;
  city: string;
  category: string;
  avatar?: string;
  rating?: number;
}

export interface HomePageResponse {
  featuredCategories: FeaturedCategory[];
  featuredProfessionals: FeaturedProfessional[];
  seo: SeoMeta;
}

// =============================================================================
// Search Page Models
// =============================================================================

export interface SearchResult {
  id: string;
  name: string;
  slug: string;
  city: string;
  category: string;
  rating: number;
  reviewCount?: number;
  avatar?: string;
  verified?: boolean;
}

export interface SearchPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number;
}

export interface SearchParams {
  city?: string;
  category?: string;
  q?: string;
  page?: number;
}

export interface SearchPageResponse {
  results: SearchResult[];
  pagination: SearchPagination;
  seo: SeoMeta;
}

// =============================================================================
// Profile Page Models
// =============================================================================

export interface ProfileService {
  id: string;
  name: string;
  price?: string;
  priceFrom?: number;
  description?: string;
}

export interface ProfileReview {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ProfileScheduleDay {
  day: string;
  hours: string;
}

export interface ProfileData {
  id: string;
  name: string;
  slug: string;
  description: string;
  city: string;
  category: string;
  imageUrl?: string;
  phone?: string;
  email?: string;
  address?: string;
  rating: number;
  reviewCount: number;
  verified?: boolean;
  memberSince?: string;
  schedule?: ProfileScheduleDay[];
}

export interface ProfilePageResponse {
  professional: ProfileData;
  services: ProfileService[];
  reviews: ProfileReview[];
  seo: SeoMeta;
}

// =============================================================================
// Store State Types
// =============================================================================

export interface StoreState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

export function createInitialState<T>(): StoreState<T> {
  return {
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
  };
}
