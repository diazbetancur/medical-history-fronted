import { inject, Injectable } from '@angular/core';
import { ApiClient } from '@data/api';
import { ExamDownloadUrlDto } from '@data/models';
import { Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import type {
  CreateExamRequest,
  PaginatedExamsResponse,
  PatientExamDto,
  UpdateExamRequest,
  UploadAttachmentsResponse,
} from '../models/patient-exam.dto';

/**
 * Real backend shape of a single exam (matches `ExamDetailDto`).
 * NOTE: this endpoint returns `contentType`/`createdAtUtc` — NOT the
 * `fileType`/`uploadedAtUtc`/`patientProfileId` of the shared `ExamDto`
 * (which belongs to the separate MVP flow and is adapted by its own service).
 */
interface ExamDetailResponse {
  id: string;
  title: string;
  examDate: string;
  notes?: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  fileUrl?: string;
  fileUrlExpiresAtUtc?: string;
}

/** Real backend shape of a list item (matches `ExamListItemDto`) — a subset of the detail. */
interface ExamListItemResponse {
  id: string;
  title: string;
  examDate: string;
  originalFileName: string;
  fileSizeBytes: number;
  createdAtUtc: string;
}

/** Real backend shape of the paginated list (matches `ExamListResponseDto`). */
interface ExamListResponse {
  items: ExamListItemResponse[];
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Patient Exams Service
 *
 * Servicio para gestionar exámenes médicos del paciente
 * Endpoints base: /api/patient/exams
 */
@Injectable({
  providedIn: 'root',
})
export class PatientExamsService {
  private readonly api = inject(ApiClient);
  private readonly basePath = '/patients/me/exams';

  /**
   * List patient exams with pagination
   *
   * GET /api/patients/me/exams?page={page}&pageSize={pageSize}&activeOnly=true
   */
  list(
    page: number = 1,
    pageSize: number = 10,
  ): Observable<PaginatedExamsResponse> {
    return this.api
      .get<ExamListResponse>(this.basePath, {
        params: {
          page: String(page),
          pageSize: String(pageSize),
          activeOnly: 'true',
        },
      })
      .pipe(
        map((response) => ({
          items: response.items.map((item) => this.mapExam(item)),
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: Math.ceil(response.total / response.pageSize),
        })),
      );
  }

  /**
   * Get exam by ID
   *
   * GET /api/patients/me/exams/{id}
   */
  getById(id: string): Observable<PatientExamDto> {
    return this.api
      .get<ExamDetailResponse>(`${this.basePath}/${id}`)
      .pipe(map((item) => this.mapExam(item)));
  }

  /**
   * Create new exam
   *
   * POST /api/patients/me/exams (multipart/form-data)
   */
  create(request: CreateExamRequest, file: File): Observable<PatientExamDto> {
    const formData = new FormData();
    formData.append('title', request.title);
    if (request.examDate) {
      formData.append('examDate', request.examDate);
    }
    if (request.notes) {
      formData.append('notes', request.notes);
    }
    formData.append('file', file, file.name);

    return this.api
      .postMultipart<ExamDetailResponse>(this.basePath, formData)
      .pipe(map((item) => this.mapExam(item)));
  }

  /**
   * Update exam
   *
   * PUT /api/patients/me/exams/{id}
   */
  update(id: string, request: UpdateExamRequest): Observable<PatientExamDto> {
    return this.api
      .put<ExamDetailResponse>(`${this.basePath}/${id}`, {
        title: request.title,
        examDate: request.examDate,
        notes: request.notes,
      })
      .pipe(map((item) => this.mapExam(item)));
  }

  /**
   * Delete exam (soft delete)
   *
   * DELETE /api/patients/me/exams/{id}
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`${this.basePath}/${id}`);
  }

  /**
   * Upload attachments to exam
   *
   * Legacy method retained for compatibility.
   * Current endpoint model stores a single file on create.
   */
  uploadAttachments(
    _examId: string,
    files: File[],
  ): Observable<UploadAttachmentsResponse> {
    return of({
      uploaded: [],
      failed: files.map((file) => ({
        fileName: file.name,
        reason:
          'El endpoint actual no permite adjuntar archivos a un examen existente',
      })),
    });
  }

  /**
   * Download attachment
   *
   * GET /api/patients/me/exams/{id}/download-url
   * Returns signed URL
   */
  getDownloadUrl(examId: string): Observable<string> {
    return this.api
      .get<ExamDownloadUrlDto>(`${this.basePath}/${examId}/download-url`)
      .pipe(map((response) => response.downloadUrl ?? response.url ?? ''));
  }

  /**
   * View attachment in browser
   *
   * GET /api/patients/me/exams/{id}/view-url
   * Returns signed URL
   */
  getViewUrl(examId: string): Observable<string> {
    return this.api
      .get<ExamDownloadUrlDto>(`${this.basePath}/${examId}/view-url`)
      .pipe(map((response) => response.url ?? response.downloadUrl ?? ''));
  }

  /**
   * Delete attachment (soft delete)
   *
   * Legacy method retained for compatibility.
   */
  deleteAttachment(_examId: string, _attachmentId: string): Observable<void> {
    return throwError(
      () =>
        new Error(
          'El endpoint actual no permite eliminar adjuntos individuales',
        ),
    );
  }

  /**
   * Keep method for compatibility with existing callers.
   */
  getAttachmentPreviewUrl(examId: string, _attachmentId: string): string {
    return this.api.buildUrl(`${this.basePath}/${examId}/download-url`);
  }

  private mapExam(
    exam: ExamDetailResponse | ExamListItemResponse,
  ): PatientExamDto {
    // List items are a subset of the detail; access detail-only fields optionally.
    const detail = exam as Partial<ExamDetailResponse>;
    const createdAt = exam.createdAtUtc;
    return {
      id: exam.id,
      patientId: '', // backend exam DTOs don't expose the patient profile id; unused by the UI
      title: exam.title,
      examDate: exam.examDate,
      notes: detail.notes,
      createdAt,
      updatedAt: detail.updatedAtUtc ?? createdAt,
      attachments: [
        {
          id: exam.id,
          examId: exam.id,
          originalFileName: exam.originalFileName,
          fileSize: exam.fileSizeBytes,
          mimeType: this.resolveMimeType(detail.contentType, exam.originalFileName),
          uploadedAt: createdAt,
        },
      ],
    };
  }

  /**
   * Resolve a usable MIME type: prefer the backend's `contentType` (only present
   * on the detail DTO); for list items (no contentType) fall back to the file
   * extension so the UI shows the right icon instead of defaulting to an image.
   */
  private resolveMimeType(contentType: string | undefined, fileName: string): string {
    if (contentType) return contentType;
    const name = (fileName ?? '').toLowerCase();
    if (name.endsWith('.pdf')) return 'application/pdf';
    if (name.endsWith('.png')) return 'image/png';
    if (name.endsWith('.webp')) return 'image/webp';
    if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
    return 'application/octet-stream';
  }
}
