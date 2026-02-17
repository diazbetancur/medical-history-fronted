/**
 * Medication Models
 * Models for patient medications with privacy controls
 * Aligned with Backend API Contract
 */

// =============================================================================
// Enums
// =============================================================================

export type MedicationStatus = 'Active' | 'Stopped';

// =============================================================================
// Medication Models
// =============================================================================

export interface MedicationDto {
  id: string;
  patientProfileId: string;
  name: string;
  dose?: string;
  frequency?: string;
  route?: string;
  prescribedBy?: string;
  startDate: string; // ISO date
  isOngoing: boolean;
  endDate?: string; // ISO date, null if isOngoing
  notes?: string;
  status: MedicationStatus;
  createdAtUtc: string;
  updatedAtUtc: string;
}

// =============================================================================
// Create/Update DTOs
// =============================================================================

export interface CreateMedicationDto {
  name: string;
  dose?: string;
  frequency?: string;
  route?: string;
  prescribedBy?: string;
  startDate: string; // ISO date
  isOngoing: boolean;
  endDate?: string; // ISO date, required if !isOngoing
  notes?: string;
  status: MedicationStatus;
}

export interface UpdateMedicationDto {
  name: string;
  dose?: string;
  frequency?: string;
  route?: string;
  prescribedBy?: string;
  startDate: string; // ISO date
  isOngoing: boolean;
  endDate?: string; // ISO date, required if !isOngoing
  notes?: string;
  status: MedicationStatus;
}

// =============================================================================
// Paginated Response Models
// =============================================================================

export interface PatientMedicationsResponseDto {
  items: MedicationDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  activeCount: number; // Count of active medications
}

export interface ProfessionalPatientMedicationsResponseDto {
  items: MedicationDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  activeCount: number;
}

// =============================================================================
// Error Codes
// =============================================================================

export const MedicationErrorCodes = {
  NO_PATIENT_RELATION: 'NO_PATIENT_RELATION',
} as const;
