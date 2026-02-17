/**
 * Specialty Models
 *
 * Modelos para el módulo de especialidades y asignación a profesionales.
 */

/**
 * Public Specialty DTO
 * GET /api/public/specialties
 */
export interface SpecialtyDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  professionalsCount: number;
}

/**
 * Professional specialty assignment item
 */
export interface ProfessionalSpecialtyAssignmentDto {
  specialtyId: string;
  specialtyName: string;
  specialtySlug: string;
  isPrimary: boolean;
  dateCreated: string;
}

/**
 * Response for assigned specialties by professional
 * GET /api/admin/professionals/{id}/specialties
 */
export interface ProfessionalSpecialtiesResponseDto {
  professionalProfileId: string;
  professionalName: string;
  specialties: ProfessionalSpecialtyAssignmentDto[];
  totalSpecialties: number;
}

/**
 * Payload for replacing professional specialties
 * PUT /api/admin/professionals/{id}/specialties
 */
export interface UpdateProfessionalSpecialtiesItemDto {
  specialtyId: string;
  isPrimary: boolean;
}

/**
 * Selected specialty state in UI
 */
export interface SelectedSpecialty {
  specialtyId: string;
  specialtyName: string;
  specialtySlug: string;
  isPrimary: boolean;
}

/**
 * Professional search result item for selector
 */
export interface ProfessionalCandidate
  {
  id: string;
  businessName: string;
  cityName: string;
  categoryName: string;
  email?: string;
}
