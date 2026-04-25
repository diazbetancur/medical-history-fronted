import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';

import {
  CreateExamDto,
  ExamDownloadUrlDto,
  ExamDto,
  PatientExamsResponseDto,
  UpdateExamDto,
} from '@data/models';
import { environment } from '@env';

/**
 * Patient Exams MVP Service
 *
 * Service for managing patient medical exams with file upload.
 * Implements the new "single file per exam" model with multipart upload.
 *
 * Endpoints: /api/patients/me/exams
 */
@Injectable({
  providedIn: 'root',
})
export class PatientExamsMvpService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/patients/me/exams`;

  // Cache for exams list (5 minutes)
  private examsCache: Map<string, Observable<PatientExamsResponseDto>> =
    new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get patient's exams (paginated)
   *
   * GET /api/patients/me/exams
   */
  getMine(page: number, pageSize: number): Observable<PatientExamsResponseDto> {
    const cacheKey = `exams_${page}_${pageSize}`;

    if (this.examsCache.has(cacheKey)) {
      return this.examsCache.get(cacheKey)!;
    }

    const request$ = this.http
      .get<any>(this.baseUrl, {
        params: {
          page: page.toString(),
          pageSize: pageSize.toString(),
        },
      })
      .pipe(
        map(
          (response) =>
            ({
              items: (response?.items ?? []).map((item: any) =>
                this.mapExam(item),
              ),
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
            }) as PatientExamsResponseDto,
        ),
        shareReplay(1),
        tap(() => {
          // Auto-invalidate cache after duration
          setTimeout(() => {
            this.examsCache.delete(cacheKey);
          }, this.CACHE_DURATION);
        }),
      );

    this.examsCache.set(cacheKey, request$);
    return request$;
  }

  /**
   * Get exam detail by id
   *
   * GET /api/patients/me/exams/{id}
   */
  getById(id: string): Observable<ExamDto> {
    return this.http
      .get<any>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => this.mapExam(response)));
  }

  /**
   * Create new exam with file upload
   *
   * POST /api/patients/me/exams (multipart/form-data)
   */
  create(dto: CreateExamDto, file: File): Observable<ExamDto> {
    const formData = new FormData();
    formData.append('title', dto.title);
    formData.append('examDate', dto.examDate);
    if (dto.notes) {
      formData.append('notes', dto.notes);
    }
    formData.append('file', file, file.name);

    return this.http
      .post<any>(this.baseUrl, formData)
      .pipe(map((response) => this.mapExam(response)));
  }

  /**
   * Update exam metadata (file cannot be changed)
   *
   * PUT /api/patients/me/exams/{id}
   */
  update(id: string, dto: UpdateExamDto): Observable<ExamDto> {
    return this.http
      .put<any>(`${this.baseUrl}/${id}`, dto)
      .pipe(map((response) => this.mapExam(response)));
  }

  /**
   * Delete exam (soft delete)
   *
   * DELETE /api/patients/me/exams/{id}
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get download URL for exam file (signed URL)
   *
   * GET /api/patients/me/exams/{id}/download-url
   */
  getDownloadUrl(id: string): Observable<ExamDownloadUrlDto> {
    return this.http.get<any>(`${this.baseUrl}/${id}/download-url`).pipe(
      map(
        (response) =>
          ({
            downloadUrl: response?.downloadUrl ?? response?.url,
            expiresAtUtc: response?.expiresAtUtc,
          }) as ExamDownloadUrlDto,
      ),
    );
  }

  private mapExam(item: any): ExamDto {
    const contentType = item?.fileContentType ?? null;
    return {
      id: item.id,
      patientProfileId: item.patientProfileId ?? '',
      title: item.title,
      examDate: item.examDate,
      notes: item.notes ?? undefined,
      fileName: item.fileName ?? item.title,
      fileType: contentType === 'application/pdf' ? 'PDF' : 'IMAGE',
      fileSizeBytes: item.fileSizeBytes ?? 0,
      uploadedAtUtc: item.dateCreated ?? item.uploadedAtUtc,
      updatedAtUtc: item.dateUpdated ?? item.updatedAtUtc ?? item.dateCreated,
      isActive: item.isActive ?? true,
      downloadUrl: item.fileUrl ?? item.downloadUrl ?? undefined,
      downloadUrlExpiresAtUtc:
        item.fileUrlExpiresAtUtc ?? item.downloadUrlExpiresAtUtc ?? undefined,
    } as ExamDto;
  }

  /**
   * Invalidate all caches
   */
  invalidateAllCaches(): void {
    this.examsCache.clear();
  }

  /**
   * Invalidate caches for a specific page/pageSize
   */
  invalidateCache(page: number, pageSize: number): void {
    const cacheKey = `exams_${page}_${pageSize}`;
    this.examsCache.delete(cacheKey);
  }
}
