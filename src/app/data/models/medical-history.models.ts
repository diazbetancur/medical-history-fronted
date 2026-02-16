/**
 * Medical History Models
 * Models for medical encounters, notes, and patient privacy
 * Aligned with Backend API Contract
 */

// =============================================================================
// Enums
// =============================================================================

export type EncounterStatus = 'Draft' | 'Closed';
export type NoteType = 'Note' | 'Addendum';

// =============================================================================
// Note Models
// =============================================================================

export interface MedicalEncounterNoteDto {
  id: string;
  type: NoteType;
  text: string;
  title?: string;
  createdAtUtc: string;
  createdByProfessionalProfileId: string;
  createdByProfessionalName: string;
}

// =============================================================================
// Medical Encounter Models (Full Detail)
// =============================================================================

export interface MedicalEncounterDto {
  id: string;
  patientProfileId: string;
  patientName?: string;
  professionalProfileId: string;
  professionalName: string;
  appointmentId?: string;
  encounterDateUtc: string;
  summary?: string;
  status: EncounterStatus;
  closedAtUtc?: string;
  isOwnEncounter?: boolean;
  notes: MedicalEncounterNoteDto[];
}

// =============================================================================
// Medical Encounter Models (List Item - Patient View)
// =============================================================================

export interface PatientEncounterListItemDto {
  id: string;
  encounterDateUtc: string;
  status: EncounterStatus;
  professionalName: string;
  summary?: string;
  notesCount: number;
}

// =============================================================================
// Medical Encounter Models (List Item - Professional View)
// =============================================================================

export interface ProfessionalEncounterListItemDto {
  id: string;
  encounterDateUtc: string;
  status: EncounterStatus;
  professionalName: string;
  summary?: string;
  notesCount: number;
  isOwnEncounter: boolean;
}

export interface CreateEncounterDto {
  summary?: string;
  initialNote: string;
  noteTitle?: string;
  appointmentId?: string;
}

export interface UpdateEncounterDto {
  summary?: string;
  initialNote: string;
}

export interface AddAddendumDto {
  text: string;
  title?: string;
}

// =============================================================================
// Patient List Models (for Professional view)
// =============================================================================

export interface PatientListItemDto {
  patientProfileId: string;
  fullName: string;
  email: string;
  phone?: string;
  shareFullHistoryFlag: boolean;
  lastAppointmentUtc?: string;
  nextAppointmentUtc?: string;
}

// =============================================================================
// Privacy Models
// =============================================================================

export interface PatientPrivacyDto {
  shareFullHistoryWithTreatingProfessionals: boolean;
}

export interface UpdatePatientPrivacyDto {
  shareFullHistoryWithTreatingProfessionals: boolean;
}

// =============================================================================
// Paginated Response Models (Backend Format)
// =============================================================================

export interface PaginatedResponseBackend<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PatientHistoryResponseDto extends PaginatedResponseBackend<PatientEncounterListItemDto> {}

export interface ProfessionalPatientHistoryResponseDto extends PaginatedResponseBackend<ProfessionalEncounterListItemDto> {
  isFilteredByPrivacy: boolean;
}

export interface ProfessionalPatientsListResponseDto extends PaginatedResponseBackend<PatientListItemDto> {}
