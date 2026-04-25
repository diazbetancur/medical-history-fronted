import { inject, Injectable } from '@angular/core';
import type {
  CreateSpecialtyDto,
  SpecialtyDto,
  UpdateSpecialtyDto,
} from '@data/models/specialty.models';
import { map, Observable } from 'rxjs';
import { ApiClient } from './api-client';

/**
 * Specialties API Service
 *
 * Endpoints usados:
 * - GET /api/admin/specialties
 * - POST /api/admin/specialties
 * - PUT /api/admin/specialties/{id}
 * - DELETE /api/specialties/{id}
 */
@Injectable({
  providedIn: 'root',
})
export class SpecialtiesApi {
  private readonly api = inject(ApiClient);

  getSpecialties(): Observable<SpecialtyDto[]> {
    return this.api
      .get<unknown>('/admin/specialties')
      .pipe(map((response) => this.normalizeSpecialties(response)));
  }

  createSpecialty(dto: CreateSpecialtyDto): Observable<SpecialtyDto> {
    return this.api.post<SpecialtyDto>('/admin/specialties', dto);
  }

  updateSpecialty(
    id: string,
    dto: UpdateSpecialtyDto,
  ): Observable<SpecialtyDto> {
    return this.api.put<SpecialtyDto>(`/admin/specialties/${id}`, dto);
  }

  deleteSpecialty(id: string): Observable<void> {
    return this.api.delete<void>(`/admin/specialties/${id}`);
  }

  private normalizeSpecialties(payload: unknown): SpecialtyDto[] {
    if (Array.isArray(payload)) {
      return payload as SpecialtyDto[];
    }

    if (!payload || typeof payload !== 'object') {
      return [];
    }

    const candidate = payload as {
      items?: unknown;
      data?: unknown;
      specialties?: unknown;
    };

    if (Array.isArray(candidate.items)) {
      return candidate.items as SpecialtyDto[];
    }

    if (Array.isArray(candidate.data)) {
      return candidate.data as SpecialtyDto[];
    }

    if (Array.isArray(candidate.specialties)) {
      return candidate.specialties as SpecialtyDto[];
    }

    return [];
  }
}
