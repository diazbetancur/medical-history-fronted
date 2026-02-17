/**
 * Public Home DTOs
 */

export interface PublicHomeSpecialtyDto {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  professionalCount?: number;
}

export interface PublicHomeProfessionalSpecialtyDto {
  id: string;
  name: string;
  slug: string;
  isPrimary: boolean;
}

export interface PublicHomeApiProfessionalDto {
  id: string;
  slug: string;
  businessName: string;
  profileImageUrl?: string;
  cityName: string;
  citySlug: string;
  isVerified: boolean;
  isFeatured: boolean;
  priceFrom?: number;
  specialties: PublicHomeProfessionalSpecialtyDto[];
}

export interface PublicHomeTotalsApiDto {
  totalProfessionals: number;
  totalPatients: number;
  totalAppointments: number;
  totalCities: number;
}

export interface PublicHomeSeoDto {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
}

export interface PublicHomeApiResponseDto {
  featuredSpecialties: PublicHomeSpecialtyDto[];
  featuredProfessionals: PublicHomeApiProfessionalDto[];
  popularCities: Array<{
    id: string;
    name: string;
    slug: string;
    stateRegion?: string;
    countryName?: string;
    countrySlug?: string;
    professionalCount?: number;
  }>;
  totals: PublicHomeTotalsApiDto;
  seo: PublicHomeSeoDto;
}

export interface PublicMetadataDto {
  countries: Array<{ id: string; name: string; iso2?: string; slug: string }>;
  cities: Array<{ id: string; name: string; slug: string; countryId: string }>;
}

export interface PublicHomeStatsDto {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  averageRating: number;
}

export interface PublicHomeProfessionalCardDto {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  fullName: string;
  specialty: string;
  avatarUrl?: string;
  rating: number;
  reviewsCount: number;
  yearsOfExperience: number;
  isAvailable: boolean;
  cityName?: string;
  citySlug?: string;
  isVerified?: boolean;
  isFeatured?: boolean;
  priceFrom?: number;
}

export interface PublicHomeDataDto {
  stats: PublicHomeStatsDto;
  featuredProfessionals: PublicHomeProfessionalCardDto[];
  specialties: Array<{ id: string; name: string; icon?: string }>;
  seo?: PublicHomeSeoDto;
  popularCities?: Array<{
    id: string;
    name: string;
    slug: string;
    professionalCount?: number;
  }>;
  metadata?: PublicMetadataDto;
}
