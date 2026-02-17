import { inject, Injectable } from '@angular/core';
import type {
  CreateInstitutionDto,
  InstitutionDto,
  InstitutionFilters,
  PaginatedInstitutionsResponse,
  UpdateInstitutionDto,
} from '@data/models/institution.models';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

/**
 * Institutions API Service
 *
 * Servicio para interactuar con el backend de instituciones.
 * Endpoints base: /api/catalog/institutions
 */
@Injectable({
  providedIn: 'root',
})
export class InstitutionsApi {
  private readonly api = inject(ApiClient);

  /**
   * Get all institutions with optional filters
   *
   * GET /api/catalog/institutions
   */
  getInstitutions(
    filters?: InstitutionFilters,
  ): Observable<PaginatedInstitutionsResponse> {
    const params: Record<string, string> = {};

    if (filters?.name) {
      params['name'] = filters.name;
    }
    if (filters?.code) {
      params['code'] = filters.code;
    }
    if (filters?.isActive !== undefined) {
      params['isActive'] = String(filters.isActive);
    }
    if (filters?.page) {
      params['page'] = String(filters.page);
    }
    if (filters?.pageSize) {
      params['pageSize'] = String(filters.pageSize);
    }

    return this.api.get<PaginatedInstitutionsResponse>(
      '/catalog/institutions',
      { params },
    );
  }

  /**
   * Get institution by ID
   *
   * GET /api/catalog/institutions/{id}
   */
  getInstitutionById(id: string): Observable<InstitutionDto> {
    return this.api.get<InstitutionDto>(`/catalog/institutions/${id}`);
  }

  /**
   * Create a new institution
   *
   * POST /api/catalog/institutions
   */
  createInstitution(dto: CreateInstitutionDto): Observable<InstitutionDto> {
    return this.api.post<InstitutionDto>('/catalog/institutions', dto);
  }

  /**
   * Update an existing institution
   *
   * PUT /api/catalog/institutions/{id}
   */
  updateInstitution(
    id: string,
    dto: UpdateInstitutionDto,
  ): Observable<InstitutionDto> {
    return this.api.put<InstitutionDto>(`/catalog/institutions/${id}`, dto);
  }

  /**
   * Delete an institution
   *
   * DELETE /api/catalog/institutions/{id}
   */
  deleteInstitution(id: string): Observable<void> {
    return this.api.delete<void>(`/catalog/institutions/${id}`);
  }
}
