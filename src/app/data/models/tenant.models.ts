/**
 * Tenant Models
 *
 * Modelos para el sistema de tenants (multi-tenant)
 */

/**
 * Tenant DTO - Entidad completa de tenant
 */
export interface TenantDto {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

/**
 * Create Tenant DTO - Datos para crear un tenant
 */
export interface CreateTenantDto {
  code: string;
  name: string;
}

/**
 * Update Tenant DTO - Datos para actualizar un tenant
 */
export interface UpdateTenantDto {
  name: string;
  isActive: boolean;
}
