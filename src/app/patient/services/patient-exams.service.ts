import { inject, Injectable } from '@angular/core';
import { ApiClient } from '@data/api';
import { ExamDto, ExamDownloadUrlDto, PatientExamsResponseDto } from '@data/models';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type {
  CreateExamRequest,
  PaginatedExamsResponse,
  PatientExamDto,
  PatientExamDto,
  UpdateExamRequest,
  UploadAttachmentsResponse,
} from '../models/patient-exam.dto';

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
      .get<PatientExamsResponseDto>(this.basePath, {
        params: {
          page: String(page),
          pageSize: String(pageSize),
          activeOnly: 'true',
        },
      })
      .pipe(
        map((response) => ({
          items: response.items.map((item) => this.mapExam(item)),
          total: response.totalCount,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages,
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
      .get<ExamDto>(`${this.basePath}/${id}`)
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
      .postMultipart<ExamDto>(this.basePath, formData)
      .pipe(map((item) => this.mapExam(item)));
  }

  /**
   * Update exam
   *
   * PUT /api/patients/me/exams/{id}
   */
  update(id: string, request: UpdateExamRequest): Observable<PatientExamDto> {
    return this.api
      .put<ExamDto>(`${this.basePath}/${id}`, {
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
    examId: string,
    files: File[],
  ): Observable<UploadAttachmentsResponse> {
    void examId;
    void files;
    return this.api.post<UploadAttachmentsResponse>('/errors/not-supported', {
      uploaded: [],
      failed: files.map((file) => ({
        fileName: file.name,
        reason: 'El endpoint actual no permite adjuntar archivos a un examen existente',
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
      .pipe(map((response) => response.downloadUrl));
  }

  /**
   * Delete attachment (soft delete)
   *
   * Legacy method retained for compatibility.
   */
  deleteAttachment(examId: string, attachmentId: string): Observable<void> {
    void examId;
    void attachmentId;
    return this.api.delete<void>('/errors/not-supported');
  }

  /**
   * Keep method for compatibility with existing callers.
   */
  getAttachmentPreviewUrl(examId: string, attachmentId: string): string {
    void attachmentId;
    return this.api.buildUrl(`${this.basePath}/${examId}/download-url`);
  }

  private mapExam(exam: ExamDto): PatientExamDto {
    return {
      id: exam.id,
      patientId: exam.patientProfileId,
      title: exam.title,
      examDate: exam.examDate,
      notes: exam.notes,
      createdAt: exam.uploadedAtUtc,
      updatedAt: exam.updatedAtUtc,
      attachments: [
        {
          id: exam.id,
          examId: exam.id,
          fileName: exam.fileName,
          fileSize: exam.fileSizeBytes,
          mimeType: exam.fileType === 'PDF' ? 'application/pdf' : 'image/*',
          uploadedAt: exam.uploadedAtUtc,
        },
      ],
    };
  }
}
