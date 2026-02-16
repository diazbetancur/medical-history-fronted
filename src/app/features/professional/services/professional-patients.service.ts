/**
 * Professional Patients Service
 *
 * Handles professional's patient list and patient history management
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { createApiError } from '@core/http/api-error';
import {
  AddAddendumDto,
  CreateEncounterDto,
  MedicalEncounterDto,
  ProfessionalPatientHistoryResponseDto,
  ProfessionalPatientsListResponseDto,
  UpdateEncounterDto,
} from '@data/models';
import { environment } from '@env';
import { catchError, Observable, tap, throwError } from 'rxjs';

/**
 * Simple in-memory cache for patient lists and history
 * Invalidated on create/update/close operations
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

@Injectable({
  providedIn: 'root',
})
export class ProfessionalPatientsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/professional`;

  // Simple cache
  private cache = new Map<string, CacheEntry<any>>();

  // Signal for privacy filtering flag
  readonly isFilteredByPrivacy = signal<boolean>(false);

  // ==========================================================================
  // Patient List
  // ==========================================================================

  /**
   * Get list of patients treated by this professional (paginated)
   * GET /api/professional/patients/mine
   *
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   */
  listMyPatients(
    page: number = 1,
    pageSize: number = 10,
  ): Observable<ProfessionalPatientsListResponseDto> {
    const cacheKey = `patients_mine_${page}_${pageSize}`;
    const cached =
      this.getFromCache<ProfessionalPatientsListResponseDto>(cacheKey);

    if (cached) {
      return new Observable((observer) => {
        observer.next(cached);
        observer.complete();
      });
    }

    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http
      .get<ProfessionalPatientsListResponseDto>(
        `${this.baseUrl}/patients/mine`,
        { params },
      )
      .pipe(
        catchError((error) => this.handleError(error)),
        tap((data) => this.setCache(cacheKey, data)),
      );
  }

  // ==========================================================================
  // Patient History
  // ==========================================================================

  /**
   * Get medical history for a specific patient (filtered by privacy flag)
   * GET /api/professional/patients/{patientProfileId}/history
   *
   * @param patientProfileId Patient Profile ID
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   */
  getPatientHistory(
    patientProfileId: string,
    page: number = 1,
    pageSize: number = 10,
  ): Observable<ProfessionalPatientHistoryResponseDto> {
    const cacheKey = `history_${patientProfileId}_${page}_${pageSize}`;
    const cached =
      this.getFromCache<ProfessionalPatientHistoryResponseDto>(cacheKey);

    if (cached) {
      this.isFilteredByPrivacy.set(cached.isFilteredByPrivacy);
      return new Observable((observer) => {
        observer.next(cached);
        observer.complete();
      });
    }

    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http
      .get<ProfessionalPatientHistoryResponseDto>(
        `${this.baseUrl}/patients/${patientProfileId}/history`,
        { params },
      )
      .pipe(
        catchError((error) => this.handleError(error)),
        tap((data) => {
          this.isFilteredByPrivacy.set(data.isFilteredByPrivacy);
          this.setCache(cacheKey, data);
        }),
      );
  }

  // ==========================================================================
  // Encounter Management
  // ==========================================================================

  /**
   * Create new medical encounter (always starts as DRAFT)
   * POST /api/professional/patients/{patientProfileId}/encounters
   *
   * @param patientProfileId Patient Profile ID
   * @param dto Encounter creation data
   */
  createEncounter(
    patientProfileId: string,
    dto: CreateEncounterDto,
  ): Observable<MedicalEncounterDto> {
    return this.http
      .post<MedicalEncounterDto>(
        `${this.baseUrl}/patients/${patientProfileId}/encounters`,
        dto,
      )
      .pipe(
        catchError((error) => this.handleError(error)),
        tap(() => this.invalidatePatientCaches(patientProfileId)),
      );
  }

  /**
   * Update draft encounter (only allowed if status = DRAFT and user is author)
   * PUT /api/professional/encounters/{id}
   *
   * @param encounterId Encounter ID
   * @param dto Update data
   */
  updateDraftEncounter(
    encounterId: string,
    dto: UpdateEncounterDto,
  ): Observable<MedicalEncounterDto> {
    return this.http
      .put<MedicalEncounterDto>(
        `${this.baseUrl}/encounters/${encounterId}`,
        dto,
      )
      .pipe(
        catchError((error) => this.handleError(error)),
        tap(() => this.invalidateAllCaches()),
      );
  }

  /**
   * Close encounter (changes status from DRAFT to CLOSED)
   * POST /api/professional/encounters/{id}/close
   *
   * @param encounterId Encounter ID
   */
  closeEncounter(encounterId: string): Observable<MedicalEncounterDto> {
    return this.http
      .post<MedicalEncounterDto>(
        `${this.baseUrl}/encounters/${encounterId}/close`,
        {},
      )
      .pipe(
        catchError((error) => this.handleError(error)),
        tap(() => this.invalidateAllCaches()),
      );
  }

  /**
   * Add addendum to closed encounter
   * POST /api/professional/encounters/{id}/addendum
   *
   * @param encounterId Encounter ID
   * @param dto Addendum data
   */
  addAddendum(
    encounterId: string,
    dto: AddAddendumDto,
  ): Observable<MedicalEncounterDto> {
    return this.http
      .post<MedicalEncounterDto>(
        `${this.baseUrl}/encounters/${encounterId}/addendum`,
        dto,
      )
      .pipe(
        catchError((error) => this.handleError(error)),
        tap(() => this.invalidateAllCaches()),
      );
  }

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  /**
   * Get data from cache if still valid
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store data in cache
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Invalidate all caches for a specific patient
   */
  public invalidatePatientCaches(patientProfileId: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
      key.includes(patientProfileId),
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
