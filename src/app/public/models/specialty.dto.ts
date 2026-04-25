/**
 * Specialty DTOs
 *
 * Models for professional specialties catalog
 */

/**
 * Specialty catalog item
 * Response from GET /api/public/specialties
 */
export interface SpecialtyDto {
  id: string;
  name: string;
  description?: string | null;
}

/**
 * Specialties list response
 */
export interface SpecialtiesResponseDto {
  specialties: SpecialtyDto[];
  total: number;
}
