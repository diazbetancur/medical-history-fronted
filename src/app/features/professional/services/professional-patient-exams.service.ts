/**
 * Professional Patient Exams Service
 *
 * Handles viewing patient exams (read-only) with relation checks
 */

import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { createApiError } from '@core/http/api-error';
import {
  ExamDownloadUrlDto,
  ProfessionalPatientExamsResponseDto,
} from '@data/models';
import { environment } from '@env';
import { catchError, Observable, tap, throwError } from 'rxjs';

/**
 * Simple in-memory cache for patient exams
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

@Injectable({
  providedIn: 'root',
})
export class ProfessionalPatientExamsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/professional/patients`;

  // Simple cache
  private cache = new Map<
    string,
    CacheEntry<ProfessionalPatientExamsResponseDto>
  >();

  // ==========================================================================
  // Read-Only Access to Patient Exams
  // ==========================================================================

  /**
   * Get patient exams (read-only)
   * GET /api/professional/patients/{patientProfileId}/exams
   *
   * @param patientProfileId Patient Profile ID
   * @param page Page number (1-based)
   * @param pageSize Number of items per page
   */
  getByPatient(
    patientProfileId: string,
    page: number = 1,
    pageSize: number = 10,
  ): Observable<ProfessionalPatientExamsResponseDto> {
    const cacheKey = `patient_${patientProfileId}_${page}_${pageSize}`;
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

    return this.http
      .get<ProfessionalPatientExamsResponseDto>(
        `${this.baseUrl}/${patientProfileId}/exams`,
        { params },
      )
      .pipe(
        tap((data) => this.setCache(cacheKey, data)),
        catchError((error) => this.handleError(error)),
      );
  }

  /**
   * Get download URL for patient exam file
   * GET /api/professional/patients/{patientProfileId}/exams/{examId}/download-url
   *
   * @param patientProfileId Patient Profile ID
   * @param examId Exam ID
   */
  getDownloadUrl(
    patientProfileId: string,
    examId: string,
  ): Observable<ExamDownloadUrlDto> {
    return this.http
      .get<ExamDownloadUrlDto>(
        `${this.baseUrl}/${patientProfileId}/exams/${examId}/download-url`,
      )
      .pipe(catchError((error) => this.handleError(error)));
  }

  // ==========================================================================
  // Cache Management
  // ==========================================================================

  /**
   * Get data from cache if still valid
   */
  private getFromCache(
    key: string,
  ): ProfessionalPatientExamsResponseDto | null {
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
    data: ProfessionalPatientExamsResponseDto,
  ): void {
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
