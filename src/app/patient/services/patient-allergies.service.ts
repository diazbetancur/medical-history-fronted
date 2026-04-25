/**
 * Patient Allergies Service
 *
 * Handles CRUD operations for patient's own allergies
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { createApiError } from '@core/http/api-error';
import {
  AllergyStatus,
  CreateAllergyDto,
  PatientAllergiesResponseDto,
  UpdateAllergyDto,
} from '@data/models';
import { environment } from '@env';
import { catchError, map, Observable, tap, throwError } from 'rxjs';

/**
 * Simple in-memory cache for patient allergies
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

@Injectable({
  providedIn: 'root',
})
export class PatientAllergiesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/patient/allergies`;

  // Simple cache
  private cache = new Map<string, CacheEntry<PatientAllergiesResponseDto>>();

  // ==========================================================================
  // Read Operations
  // ==========================================================================

  /**
   * Get patient's own allergies (paginated)
   * GET /api/patient/allergies
   *
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   * @param status Filter by status (optional)
   */
  getMine(
    page: number = 1,
    pageSize: number = 10,
    status?: AllergyStatus,
  ): Observable<PatientAllergiesResponseDto> {
    const cacheKey = `mine_${page}_${pageSize}_${status ?? 'all'}`;
    const cached = this.getFromCache(cacheKey);

    if (cached) {
      return new Observable((observer) => {
        observer.next(cached);
        observer.complete();
      });
    }

    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map(
        (response) =>
          ({
            items: response?.items ?? [],
            totalCount: response?.total ?? response?.totalCount ?? 0,
            page: response?.page ?? page,
            pageSize: response?.pageSize ?? pageSize,
            totalPages:
              response?.totalPages ??
              Math.max(
                1,
                Math.ceil(
                  (response?.total ?? 0) / (response?.pageSize ?? pageSize),
                ),
              ),
            activeCount:
              response?.activeCount ??
              (response?.items ?? []).filter(
                (item: any) => item.status === 'Active',
              ).length,
          }) as PatientAllergiesResponseDto,
      ),
      tap((data) => this.setCache(cacheKey, data)),
      catchError((error) => this.handleError(error)),
    );
  }

  // ==========================================================================
  // Create Operation
  // ==========================================================================

  /**
   * Create a new allergy
   * POST /api/patient/allergies
   */
  create(dto: CreateAllergyDto): Observable<{ id: string; message: string }> {
    return this.http
      .post<any>(this.baseUrl, dto)
      .pipe(map((response) => ({ id: response?.id ?? '', message: 'OK' })))
      .pipe(
        tap(() => this.invalidateAllCaches()),
        catchError((error) => this.handleError(error)),
      );
  }

  // ==========================================================================
  // Update Operation
  // ==========================================================================

  /**
   * Update an existing allergy
   * PUT /api/patient/allergies/{id}
   */
  update(id: string, dto: UpdateAllergyDto): Observable<{ message: string }> {
    return this.http
      .put<any>(`${this.baseUrl}/${id}`, dto)
      .pipe(map(() => ({ message: 'OK' })))
      .pipe(
        tap(() => this.invalidateAllCaches()),
        catchError((error) => this.handleError(error)),
      );
  }

  // ==========================================================================
  // Delete Operation
  // ==========================================================================

  /**
   * Delete an allergy
   * DELETE /api/patient/allergies/{id}
   */
  delete(id: string): Observable<{ message: string }> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`)
      .pipe(map(() => ({ message: 'OK' })))
      .pipe(
        tap(() => this.invalidateAllCaches()),
        catchError((error) => this.handleError(error)),
      );
  }

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  /**
   * Get data from cache if still valid
   */
  private getFromCache(key: string): PatientAllergiesResponseDto | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store data in cache
   */
  private setCache(key: string, data: PatientAllergiesResponseDto): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate all caches (call after create/update/delete)
   */
  public invalidateAllCaches(): void {
    this.cache.clear();
  }

  /**
   * Handle HTTP errors and convert to ApiError
   */
  private handleError(error: unknown): Observable<never> {
    return throwError(() => createApiError(error));
  }
}
