/**
 * Patient Exam DTOs
 *
 * Modelos para exámenes médicos del paciente
 */

/**
 * Exam Category - Categorías de exámenes
 */
export type ExamCategory =
  | 'LABORATORIO'
  | 'IMAGENOLOGIA'
  | 'CARDIOLOGIA'
  | 'OTROS';

/**
 * Patient Exam DTO - Examen médico del paciente
 */
export interface PatientExamDto {
  id: string;
  patientId: string;
  title: string;
  category?: ExamCategory;
  examDate?: string; // ISO date YYYY-MM-DD
  notes?: string;
  attachments: ExamAttachmentDto[];
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/**
 * Exam Attachment DTO - Adjunto del examen
 */
export interface ExamAttachmentDto {
  id: string;
  examId: string;
  fileName: string;
  fileSize: number; // bytes
  mimeType: string;
  uploadedAt: string; // ISO datetime
  downloadUrl?: string; // Optional pre-signed URL
}

/**
 * Create Exam Request
 */
export interface CreateExamRequest {
  title: string;
  category?: ExamCategory;
  examDate?: string; // ISO date YYYY-MM-DD
  notes?: string;
}

/**
 * Update Exam Request
 */
export interface UpdateExamRequest {
  title?: string;
  category?: ExamCategory;
  examDate?: string;
  notes?: string;
}

/**
 * Paginated Exams Response
 */
export interface PaginatedExamsResponse {
  items: PatientExamDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Upload Attachments Response
 */
export interface UploadAttachmentsResponse {
  uploaded: ExamAttachmentDto[];
  failed: { fileName: string; reason: string }[];
}

/**
 * Exam Category Labels (for UI)
 */
export const EXAM_CATEGORY_LABELS: Record<ExamCategory, string> = {
  LABORATORIO: 'Laboratorio',
  IMAGENOLOGIA: 'Imagenología',
  CARDIOLOGIA: 'Cardiología',
  OTROS: 'Otros',
};

/**
 * Allowed file extensions for uploads
 */
export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

/**
 * Max file size (10MB in bytes)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
