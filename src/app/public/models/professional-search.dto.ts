/**
 * Professional Search DTOs
 *
 * Models for public professional search and directory
 */

/**
 * Professional search result item
 */
export interface ProfessionalSearchResultDto {
  professionalProfileId: string;
  slug: string;
  userId: string;
  fullName: string;
  professionalTitle?: string;
  photoUrl?: string;
  specialties: SpecialtyItemDto[];
  city?: string;
  country?: string;
  rating?: number;
  reviewCount?: number;
  yearsOfExperience?: number;
  isAvailableForAppointments: boolean;
}

/**
 * Specialty item in professional profile
 */
export interface SpecialtyItemDto {
  id: string;
  name: string;
}

/**
 * Professional search filters
 */
export interface ProfessionalSearchFiltersDto {
  q?: string; // Text search (name, title, bio)
  specialtyId?: string;
  cityId?: string;
  countryId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Professional search response (paginated)
 */
export interface ProfessionalSearchResponseDto {
  professionals: ProfessionalSearchResultDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Professional detail (full profile)
 */
export interface ProfessionalDetailDto {
  professionalProfileId: string;
  slug: string;
  userId: string;
  fullName: string;
  professionalTitle?: string;
  photoUrl?: string;
  bio?: string;
  specialties: SpecialtyItemDto[];
  city?: string;
  country?: string;
  rating?: number;
  reviewCount?: number;
  yearsOfExperience?: number;
  isAvailableForAppointments: boolean;
  // Additional fields for detail view
  education?: string[];
  certifications?: string[];
  languages?: string[];
  consultationFee?: number;
  currency?: string;
}

/**
 * Helper: Get initials from full name
 */
export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Helper: Format rating display
 */
export function formatRating(rating?: number): string {
  if (!rating) return 'N/A';
  return rating.toFixed(1);
}

/**
 * Helper: Build cache key for search query
 */
export function buildSearchCacheKey(
  filters: ProfessionalSearchFiltersDto,
): string {
  const parts = [
    filters.q || '',
    filters.specialtyId || '',
    filters.cityId || '',
    filters.countryId || '',
    filters.page?.toString() || '1',
    filters.pageSize?.toString() || '10',
  ];
  return parts.join('|');
}
