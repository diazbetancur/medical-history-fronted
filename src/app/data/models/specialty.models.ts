/**
 * Specialty Models
 *
 * Modelos para CRUD de catálogo de especialidades.
 */

/**
 * Public Specialty DTO
 * GET /api/public/specialties
 */
export interface SpecialtyDto {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  professionalsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSpecialtyDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateSpecialtyDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}
