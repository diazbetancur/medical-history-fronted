/**
 * Professional Patient Medications Service
 *
 * Handles viewing patient medications (read-only) with relation checks
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { createApiError } from '@core/http/api-error';
import {
  MedicationStatus,
  ProfessionalPatientMedicationsResponseDto,
} from '@data/models';
import { environment } from '@env';
import { catchError, Observable, tap, throwError } from 'rxjs';

/**
 * Simple in-memory cache for patient medications
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

@Injectable({
  providedIn: 'root',
})
export class ProfessionalPatientMedicationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/professional/patients`;

  // Simple cache
  private cache = new Map<
    string,
    CacheEntry<ProfessionalPatientMedicationsResponseDto>
  >();

  // ==========================================================================
  // Read-Only Access to Patient Medications
  // ==========================================================================

  /**
   * Get patient medications (read-only)
   * GET /api/professional/patients/{patientProfileId}/medications
   *
   * @param patientProfileId Patient Profile ID
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   * @param status Filter by status (optional)
   */
  getByPatient(
    patientProfileId: number,
    page: number = 1,
    pageSize: number = 10,
    status?: MedicationStatus,
  ): Observable<ProfessionalPatientMedicationsResponseDto> {
    const cacheKey = `patient_${patientProfileId}_${page}_${pageSize}_${status ?? 'all'}`;
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
      .get<ProfessionalPatientMedicationsResponseDto>(
        `${this.baseUrl}/${patientProfileId}/medications`,
        { params },
      )
      .pipe(
        tap((data) => this.setCache(cacheKey, data)),
        catchError((error) => this.handleError(error)),
      );
  }

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  /**
   * Get data from cache if still valid
   */
  private getFromCache(
    key: string,
  ): ProfessionalPatientMedicationsResponseDto | null {
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
  private setCache(
    key: string,
    data: ProfessionalPatientMedicationsResponseDto,
  ): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate all caches for a specific patient
   */
  public invalidatePatientCaches(patientProfileId: number): void {
    const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
      key.includes(patientProfileId.toString()),
    );
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Invalidate all caches
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
