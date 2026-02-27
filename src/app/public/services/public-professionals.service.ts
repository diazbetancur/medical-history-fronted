/**
 * Public Professionals Service
 *
 * Handles public professional search and directory
 * with in-memory caching per query
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiError, createApiError } from '@core/http/api-error';
import { environment } from '@env';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import {
  buildSearchCacheKey,
  ProfessionalDetailDto,
  ProfessionalSearchFiltersDto,
  ProfessionalSearchResultDto,
  ProfessionalSearchResponseDto,
} from '../models/professional-search.dto';

interface SearchApiSpecialtyItem {
  id: string;
  name: string;
  isPrimary?: boolean;
}

interface SearchApiItem {
  id: string;
  displayName: string;
  slug: string;
  profileImageUrl?: string;
  cityName?: string;
  countryName?: string;
  specialties?: SearchApiSpecialtyItem[];
}

interface SearchApiResponse {
  items?: SearchApiItem[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  professionals?: ProfessionalSearchResultDto[];
  total?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PublicProfessionalsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/public/professionals`;

  // In-memory cache: key = query string, value = response
  private readonly searchCache = new Map<
    string,
    ProfessionalSearchResponseDto
  >();
  private readonly detailCache = new Map<string, ProfessionalDetailDto>();

  /**
   * Search professionals with filters
   * Cached by query params for performance
   */
  search(
    filters: ProfessionalSearchFiltersDto,
  ): Observable<ProfessionalSearchResponseDto> {
    const cacheKey = buildSearchCacheKey(filters);

    // Return cached result if available
    if (this.searchCache.has(cacheKey)) {
      return of(this.searchCache.get(cacheKey)!);
    }

    // Build query params
    let params = new HttpParams();
    if (filters.q) params = params.set('q', filters.q);
    if (filters.specialtyId)
      params = params.set('specialtyId', filters.specialtyId);
    if (filters.cityId) params = params.set('cityId', filters.cityId);
    if (filters.countryId) params = params.set('countryId', filters.countryId);
    params = params.set('page', filters.page?.toString() || '1');
    params = params.set('pageSize', filters.pageSize?.toString() || '10');

    return this.http
      .get<SearchApiResponse>(`${this.baseUrl}/search`, { params })
      .pipe(
        map((response) => this.normalizeSearchResponse(response)),
        tap((response) => {
          // Cache the result
          this.searchCache.set(cacheKey, response);
        }),
        catchError((error) => {
          const apiError: ApiError = createApiError(error);
          return throwError(() => apiError);
        }),
      );
  }

  private normalizeSearchResponse(
    response: SearchApiResponse,
  ): ProfessionalSearchResponseDto {
    if (Array.isArray(response.professionals)) {
      return {
        professionals: response.professionals,
        total: response.total ?? response.professionals.length,
        page: response.page ?? 1,
        pageSize: response.pageSize ?? 10,
        totalPages: response.totalPages ?? 1,
      };
    }

    const professionals: ProfessionalSearchResultDto[] = (response.items ?? []).map(
      (item) => ({
        professionalProfileId: item.id,
        slug: item.slug,
        userId: '',
        fullName: item.displayName,
        photoUrl: item.profileImageUrl,
        specialties: (item.specialties ?? []).map((specialty) => ({
          id: specialty.id,
          name: specialty.name,
        })),
        city: item.cityName,
        country: item.countryName,
        isAvailableForAppointments: true,
      }),
    );

    return {
      professionals,
      total: response.totalCount ?? professionals.length,
      page: response.page ?? 1,
      pageSize: response.pageSize ?? 10,
      totalPages: response.totalPages ?? 1,
    };
  }

  /**
   * Get professional detail by slug
   * Cached by slug for performance
   */
  getBySlug(slug: string): Observable<ProfessionalDetailDto> {
    // Return cached result if available
    if (this.detailCache.has(slug)) {
      return of(this.detailCache.get(slug)!);
    }

    return this.http.get<ProfessionalDetailDto>(`${this.baseUrl}/${slug}`).pipe(
      tap((detail) => {
        // Cache the result
        this.detailCache.set(slug, detail);
      }),
      catchError((error) => {
        const apiError: ApiError = createApiError(error);
        return throwError(() => apiError);
      }),
    );
  }

  /**
   * Clear search cache
   * Use when data might be stale (e.g., after creating new appointment)
   */
  clearSearchCache(): void {
    this.searchCache.clear();
  }

  /**
   * Clear detail cache
   */
  clearDetailCache(): void {
    this.detailCache.clear();
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.clearSearchCache();
    this.clearDetailCache();
  }
}
