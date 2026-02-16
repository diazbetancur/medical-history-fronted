/**
 * Institution Models
 *
 * Modelos para el sistema de instituciones/catálogo
 */

/**
 * Institution DTO - Entidad completa de institución
 */
export interface InstitutionDto {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Institution DTO - Datos para crear una institución
 */
export interface CreateInstitutionDto {
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive?: boolean;
}

/**
 * Update Institution DTO - Datos para actualizar una institución
 */
export interface UpdateInstitutionDto {
  name?: string;
  code?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive?: boolean;
}

/**
 * Institution Filters - Filtros para búsqueda de instituciones
 */
export interface InstitutionFilters {
  name?: string;
  code?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

/**
 * Paginated Institutions Response
 */
export interface PaginatedInstitutionsResponse {
  items: InstitutionDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
