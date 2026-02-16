import { inject, Injectable } from '@angular/core';
import { ApiClient } from '@data/api';
import { Observable } from 'rxjs';
import type {
  CreateExamRequest,
  PaginatedExamsResponse,
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

  /**
   * List patient exams with pagination
   *
   * GET /api/patient/exams?page={page}&pageSize={pageSize}
   */
  list(
    page: number = 1,
    pageSize: number = 10,
  ): Observable<PaginatedExamsResponse> {
    return this.api.get<PaginatedExamsResponse>('/patient/exams', {
      params: {
        page: String(page),
        pageSize: String(pageSize),
      },
    });
  }

  /**
   * Get exam by ID
   *
   * GET /api/patient/exams/{id}
   */
  getById(id: string): Observable<PatientExamDto> {
    return this.api.get<PatientExamDto>(`/patient/exams/${id}`);
  }

  /**
   * Create new exam
   *
   * POST /api/patient/exams
   */
  create(request: CreateExamRequest): Observable<PatientExamDto> {
    return this.api.post<PatientExamDto>('/patient/exams', request);
  }

  /**
   * Update exam
   *
   * PUT /api/patient/exams/{id}
   */
  update(id: string, request: UpdateExamRequest): Observable<PatientExamDto> {
    return this.api.put<PatientExamDto>(`/patient/exams/${id}`, request);
  }

  /**
   * Delete exam (soft delete)
   *
   * DELETE /api/patient/exams/{id}
   */
  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/patient/exams/${id}`);
  }

  /**
   * Upload attachments to exam
   *
   * POST /api/patient/exams/{id}/attachments (multipart/form-data)
   */
  uploadAttachments(
    examId: string,
    files: File[],
  ): Observable<UploadAttachmentsResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });

    return this.api.postMultipart<UploadAttachmentsResponse>(
      `/patient/exams/${examId}/attachments`,
      formData,
    );
  }

  /**
   * Download attachment
   *
   * GET /api/patient/exams/{examId}/attachments/{attachmentId}/download
   * Returns the download URL or blob
   */
  downloadAttachment(examId: string, attachmentId: string): string {
    // Return the download URL - browser will handle the download
    return this.api.buildUrl(
      `/patient/exams/${examId}/attachments/${attachmentId}/download`,
    );
  }

  /**
   * Delete attachment (soft delete)
   *
   * DELETE /api/patient/exams/{examId}/attachments/{attachmentId}
   */
  deleteAttachment(examId: string, attachmentId: string): Observable<void> {
    return this.api.delete<void>(
      `/patient/exams/${examId}/attachments/${attachmentId}`,
    );
  }

  /**
   * Get attachment preview URL
   *
   * For displaying images inline
   */
  getAttachmentPreviewUrl(examId: string, attachmentId: string): string {
    return this.api.buildUrl(
      `/patient/exams/${examId}/attachments/${attachmentId}/preview`,
    );
  }
}
