import { inject, Injectable } from '@angular/core';
import type {
  AvailabilitySlotsResponse,
  PaginatedProfessionalsResponse,
  ProfessionalPublicProfile,
  SearchProfessionalsFilters,
} from '@data/models/availability.models';
import { map, Observable } from 'rxjs';
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

  private mapSlotResponse(
    professionalId: string,
    response: any,
  ): AvailabilitySlotsResponse {
    const items = Array.isArray(response?.items) ? response.items : [];
    return {
      date: response?.date ?? '',
      timeZone: response?.timeZone ?? 'America/Bogota',
      slotMinutes: response?.slotMinutes ?? 30,
      totalSlots: response?.totalSlots ?? items.length,
      slots: items.map((item: any) => ({
        startTime: item.startLocal,
        endTime: item.endLocal,
        startUtc: item.startUtc,
        endUtc: item.endUtc,
        duration: response?.slotMinutes ?? 30,
        isAvailable: true,
        professionalId,
        date: response?.date ?? '',
        professionalLocationId: item.professionalLocationId ?? null,
        professionalLocationName: item.professionalLocationName ?? null,
        professionalLocationAddress: item.professionalLocationAddress ?? null,
      })),
    };
  }

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
    durationMinutes = 30,
  ): Observable<AvailabilitySlotsResponse> {
    return this.api
      .get<any>(`/professional/${professionalIdOrSlug}/availability/slots`, {
        params: { date, durationMinutes },
      })
      .pipe(
        map((response) => this.mapSlotResponse(professionalIdOrSlug, response)),
      );
  }
}
