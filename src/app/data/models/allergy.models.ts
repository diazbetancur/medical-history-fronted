/**
 * Allergy Models
 * Models for patient allergies with privacy controls
 * Aligned with Backend API Contract
 */

// =============================================================================
// Enums
// =============================================================================

export type AllergySeverity = 'Mild' | 'Moderate' | 'Severe';
export type AllergyStatus = 'Active' | 'Resolved';

// =============================================================================
// Allergy Models
// =============================================================================

export interface AllergyDto {
  id: string;
  patientProfileId: string;
  allergen: string;
  reaction?: string;
  severity?: AllergySeverity;
  status: AllergyStatus;
  onsetDate?: string; // ISO date
  notes?: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}

// =============================================================================
// Create/Update DTOs
// =============================================================================

export interface CreateAllergyDto {
  allergen: string;
  reaction?: string;
  severity?: AllergySeverity;
  status: AllergyStatus;
  onsetDate?: string; // ISO date
  notes?: string;
}

export interface UpdateAllergyDto {
  allergen: string;
  reaction?: string;
  severity?: AllergySeverity;
  status: AllergyStatus;
  onsetDate?: string; // ISO date
  notes?: string;
}

// =============================================================================
// Paginated Response Models
// =============================================================================

export interface PatientAllergiesResponseDto {
  items: AllergyDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  activeCount: number; // Count of active allergies
}

export interface ProfessionalPatientAllergiesResponseDto {
  items: AllergyDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  activeCount: number;
  isBlocked: boolean; // true if patient privacy blocks access
}

// =============================================================================
// Error Codes
// =============================================================================

export const AllergyErrorCodes = {
  PATIENT_PRIVACY_BLOCKED: 'PATIENT_PRIVACY_BLOCKED',
  NO_PATIENT_RELATION: 'NO_PATIENT_RELATION',
} as const;
