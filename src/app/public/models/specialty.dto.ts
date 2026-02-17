/**
 * Specialty DTOs
 *
 * Models for professional specialties catalog
 */

/**
 * Specialty catalog item
 */
export interface SpecialtyDto {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  professionalCount?: number; // Optional: number of professionals with this specialty
}

/**
 * Specialties list response
 */
export interface SpecialtiesResponseDto {
  specialties: SpecialtyDto[];
  total: number;
}
