import { inject, Injectable } from '@angular/core';
import type {
  AvailabilitySlotsResponse,
  PaginatedProfessionalsResponse,
  ProfessionalPublicProfile,
  SearchProfessionalsFilters,
} from '@data/models/availability.models';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

/**
 * Professionals Public API Service
 *
 * Servicio para buscar profesionales y ver su disponibilidad (público).
 * Endpoints base: /api/public/professionals
 */
@Injectable({
  providedIn: 'root',
})
export class ProfessionalsPublicApi {
  private readonly api = inject(ApiClient);

  /**
   * Search professionals with filters
   *
   * GET /api/public/professionals
   */
  searchProfessionals(
    filters?: SearchProfessionalsFilters,
  ): Observable<PaginatedProfessionalsResponse> {
    const params: Record<string, string> = {};

    if (filters?.query) {
      params['query'] = filters.query;
    }
    if (filters?.specialty) {
      params['specialty'] = filters.specialty;
    }
    if (filters?.location) {
      params['location'] = filters.location;
    }
    if (filters?.page) {
      params['page'] = String(filters.page);
    }
    if (filters?.pageSize) {
      params['pageSize'] = String(filters.pageSize);
    }

    return this.api.get<PaginatedProfessionalsResponse>(
      '/public/professionals',
      { params },
    );
  }

  /**
   * Get professional public profile by slug
   *
   * GET /api/public/professionals/{slug}
   */
  getProfessionalBySlug(slug: string): Observable<ProfessionalPublicProfile> {
    return this.api.get<ProfessionalPublicProfile>(
      `/public/professionals/${slug}`,
    );
  }

  /**
   * Get availability slots for a professional on a specific date
   *
   * GET /api/public/professionals/{professionalId}/slots
   */
  getAvailabilitySlots(
    professionalIdOrSlug: string,
    date: string,
  ): Observable<AvailabilitySlotsResponse> {
    return this.api.get<AvailabilitySlotsResponse>(
      `/public/professionals/${professionalIdOrSlug}/slots`,
      {
        params: { date },
      },
    );
  }
}
