import { inject, Injectable } from '@angular/core';
import type {
  CreateTenantDto,
  TenantDto,
  UpdateTenantDto,
} from '@data/models/tenant.models';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

/**
 * Tenants API Service
 *
 * Servicio para interactuar con el backend de tenants.
 * Endpoints base: /api/admin/tenants
 */
@Injectable({
  providedIn: 'root',
})
export class TenantsApi {
  private readonly api = inject(ApiClient);

  /**
   * Get all tenants
   *
   * GET /api/admin/tenants
   */
  getAll(): Observable<TenantDto[]> {
    return this.api.get<TenantDto[]>('/admin/tenants');
  }

  /**
   * Get tenant by ID
   *
   * GET /api/admin/tenants/{id}
   */
  getById(id: string): Observable<TenantDto> {
    return this.api.get<TenantDto>(`/admin/tenants/${id}`);
  }

  /**
   * Create a new tenant
   *
   * POST /api/admin/tenants
   */
  create(dto: CreateTenantDto): Observable<TenantDto> {
    return this.api.post<TenantDto>('/admin/tenants', dto);
  }

  /**
   * Update an existing tenant
   *
   * PUT /api/admin/tenants/{id}
   */
  update(id: string, dto: UpdateTenantDto): Observable<TenantDto> {
    return this.api.put<TenantDto>(`/admin/tenants/${id}`, dto);
  }

  /**
   * Assign (or remove) a tenant to a professional profile
   *
   * PUT /api/admin/professionals/{professionalProfileId}/tenant
   */
  assignProfessionalTenant(
    professionalProfileId: string,
    tenantId: string | null,
  ): Observable<void> {
    return this.api.put<void>(
      `/admin/professionals/${professionalProfileId}/tenant`,
      { tenantId },
    );
  }

  /**
   * Assign (or remove) a tenant to a user
   *
   * PUT /api/admin/users/{userId}/tenant
   */
  assignUserTenant(
    userId: string,
    tenantId: string | null,
  ): Observable<void> {
    return this.api.put<void>(`/admin/users/${userId}/tenant`, { tenantId });
  }
}
