/**
 * Public Catalog Service
 *
 * Handles public catalog data (specialties, cities, etc.)
 * with in-memory caching per session
 */

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ApiError, createApiError } from '@core/http/api-error';
import { environment } from '@env';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { SpecialtyDto } from '../models/specialty.dto';

interface SpecialtyApiItem {
  id?: string;
  name?: string;
  description?: string | null;
  specialtyId?: string;
  specialtyName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PublicCatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/public`;

  // In-memory cache (valid for entire session)
  private specialtiesCache: SpecialtyDto[] | null = null;

  /**
   * Get all specialties
   * Cached in memory for performance
   */
  getSpecialties(): Observable<SpecialtyDto[]> {
    // Return cached data if available
    if (this.specialtiesCache) {
      return of(this.specialtiesCache);
    }

    return this.http
      .get<SpecialtyApiItem[]>(`${this.baseUrl}/specialties`)
      .pipe(
        map((items) =>
          (items ?? [])
            .map((item) => ({
              id: item.id ?? item.specialtyId ?? '',
              name: item.name ?? item.specialtyName ?? '',
              description: item.description ?? null,
            }))
            .filter((item) => !!item.id && !!item.name),
        ),
        tap((specialties) => {
          // Cache the result
          this.specialtiesCache = specialties;
        }),
        catchError((error) => {
          const apiError: ApiError = createApiError(error);
          return throwError(() => apiError);
        }),
      );
  }

  /**
   * Clear specialties cache
   * Use when data might be stale
   */
  clearSpecialtiesCache(): void {
    this.specialtiesCache = null;
  }
}
