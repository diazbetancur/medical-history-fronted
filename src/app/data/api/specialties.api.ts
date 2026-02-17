import { Injectable, inject } from '@angular/core';
import type {
  AdminProfessionalsResponse,
  AdminProfessionalsParams,
} from '@data/api/api-models';
import type {
  ProfessionalSpecialtiesResponseDto,
  SpecialtyDto,
  UpdateProfessionalSpecialtiesItemDto,
} from '@data/models/specialty.models';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

/**
 * Specialties API Service
 *
 * Endpoints usados:
 * - GET /api/public/specialties
 * - GET /api/admin/professionals/{id}/specialties
 * - PUT /api/admin/professionals/{id}/specialties
 * - GET /api/admin/professionals (búsqueda de profesionales)
 */
@Injectable({
  providedIn: 'root',
})
export class SpecialtiesApi {
  private readonly api = inject(ApiClient);

  getCatalog(): Observable<SpecialtyDto[]> {
    return this.api.get<SpecialtyDto[]>('/public/specialties');
  }

  searchProfessionals(
    params: AdminProfessionalsParams,
  ): Observable<AdminProfessionalsResponse> {
    const query = this.buildProfessionalsParams(params).toString();
    const endpoint = query
      ? '/admin/professionals?' + query
      : '/admin/professionals';
    return this.api.get<AdminProfessionalsResponse>(endpoint);
  }

  getProfessionalSpecialties(
    professionalProfileId: string,
  ): Observable<ProfessionalSpecialtiesResponseDto> {
    return this.api.get<ProfessionalSpecialtiesResponseDto>(
      `/admin/professionals/${professionalProfileId}/specialties`,
    );
  }

  updateProfessionalSpecialties(
    professionalProfileId: string,
    payload: UpdateProfessionalSpecialtiesItemDto[],
  ): Observable<ProfessionalSpecialtiesResponseDto> {
    return this.api.put<ProfessionalSpecialtiesResponseDto>(
      `/admin/professionals/${professionalProfileId}/specialties`,
      payload,
    );
  }

  private buildProfessionalsParams(
    params: AdminProfessionalsParams,
  ): URLSearchParams {
    const searchParams = new URLSearchParams();

    if (params.status) {
      searchParams.set('status', params.status);
    }
    if (params.q) {
      searchParams.set('q', params.q);
    }
    if (params.page && params.page > 1) {
      searchParams.set('page', String(params.page));
    }
    if (params.pageSize && params.pageSize > 0) {
      searchParams.set('pageSize', String(params.pageSize));
    }

    return searchParams;
  }
}
