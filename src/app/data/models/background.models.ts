/**
 * Medical Background Models
 *
 * DTOs for patient medical background/history (antecedentes)
 */

/**
 * Background Type
 */
export type BackgroundType =
  | 'Chronic'
  | 'Surgical'
  | 'Traumatic'
  | 'Allergic'
  | 'Hereditary'
  | 'Perinatal'
  | 'Pharmacological'
  | 'Other';

/**
 * Background DTO (full entity)
 */
export interface BackgroundDto {
  id: string;
  patientProfileId: string;
  type: BackgroundType;
  title: string;
  description: string | null;
  eventDate: string | null; // ISO date
  isChronic: boolean;
  isActive: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/**
 * Create Background DTO
 */
export interface CreateBackgroundDto {
  type: BackgroundType;
  title: string;
  description?: string | null;
  eventDate?: string | null; // ISO date
  isChronic: boolean;
}

/**
 * Update Background DTO
 */
export interface UpdateBackgroundDto {
  type?: BackgroundType;
  title?: string;
  description?: string | null;
  eventDate?: string | null; // ISO date
  isChronic?: boolean;
}

/**
 * Patient Background Response DTO (simple list, no pagination)
 */
export interface PatientBackgroundResponseDto {
  items: BackgroundDto[];
  totalCount: number;
}

/**
 * Professional Patient Background Response DTO
 */
export interface ProfessionalPatientBackgroundResponseDto {
  items: BackgroundDto[];
  totalCount: number;
}

/**
 * Background Error Codes
 */
export const BackgroundErrorCodes = {
  NO_PATIENT_RELATION: 'NO_PATIENT_RELATION',
} as const;
