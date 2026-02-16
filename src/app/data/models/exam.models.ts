/**
 * Exam Models
 * Models for patient exams (PDF/images) with file upload support
 */

// =============================================================================
// Enums
// =============================================================================

export type ExamFileType = 'PDF' | 'IMAGE';

// =============================================================================
// Exam Models
// =============================================================================

export interface ExamDto {
  id: string;
  patientProfileId: string;
  title: string;
  examDate: string; // ISO date
  notes?: string;
  fileName: string;
  fileType: ExamFileType;
  fileSizeBytes: number;
  uploadedAtUtc: string;
  updatedAtUtc: string;
  isActive: boolean;
}

// =============================================================================
// Create/Update DTOs
// =============================================================================

export interface CreateExamDto {
  title: string;
  examDate: string; // ISO date
  notes?: string;
}

export interface UpdateExamDto {
  title: string;
  examDate: string; // ISO date
  notes?: string;
}

// =============================================================================
// Paginated Response Models
// =============================================================================

export interface PatientExamsResponseDto {
  items: ExamDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProfessionalPatientExamsResponseDto {
  items: ExamDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// =============================================================================
// Download URL Response
// =============================================================================

export interface ExamDownloadUrlDto {
  downloadUrl: string;
  expiresAtUtc: string;
}

// =============================================================================
// Error Codes
// =============================================================================

export const ExamErrorCodes = {
  NO_PATIENT_RELATION: 'NO_PATIENT_RELATION',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
} as const;
