/**
 * Patient Medications Service
 *
 * Handles patient's own medications CRUD operations
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { createApiError } from '@core/http/api-error';
import {
  CreateMedicationDto,
  MedicationDto,
  MedicationStatus,
  PatientMedicationsResponseDto,
  UpdateMedicationDto,
} from '@data/models';
import { environment } from '@env';
import { catchError, Observable, tap, throwError } from 'rxjs';

/**
 * Simple in-memory cache for medications list
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

@Injectable({
  providedIn: 'root',
})
export class PatientMedicationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/patients/me/medications`;

  // Simple cache
  private cache = new Map<string, CacheEntry<PatientMedicationsResponseDto>>();

  // ==========================================================================
  // Medications List
  // ==========================================================================

  /**
   * Get patient's own medications (paginated)
   * GET /api/patient/medications
   *
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   * @param status Filter by status (optional)
   */
  getMine(
    page: number = 1,
    pageSize: number = 10,
    status?: MedicationStatus,
  ): Observable<PatientMedicationsResponseDto> {
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

    return this.http
      .get<PatientMedicationsResponseDto>(this.baseUrl, { params })
      .pipe(
        tap((data) => this.setCache(cacheKey, data)),
        catchError((error) => this.handleError(error)),
      );
  }

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================

  /**
   * Create new medication
   * POST /api/patient/medications
   *
   * @param dto Medication data
   */
  create(dto: CreateMedicationDto): Observable<MedicationDto> {
    return this.http.post<MedicationDto>(this.baseUrl, dto).pipe(
      tap(() => this.invalidateAllCaches()),
      catchError((error) => this.handleError(error)),
    );
  }

  /**
   * Update medication
   * PUT /api/patient/medications/{id}
   *
   * @param id Medication ID
   * @param dto Updated medication data
   */
  update(id: string, dto: UpdateMedicationDto): Observable<MedicationDto> {
    return this.http.put<MedicationDto>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(() => this.invalidateAllCaches()),
      catchError((error) => this.handleError(error)),
    );
  }

  /**
   * Delete medication
   * DELETE /api/patient/medications/{id}
   *
   * @param id Medication ID
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
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
  private getFromCache(key: string): PatientMedicationsResponseDto | null {
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
  private setCache(key: string, data: PatientMedicationsResponseDto): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate all caches (after create/update/delete)
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
