/**
 * Patient Profile DTOs
 *
 * Data Transfer Objects for patient profile API
 */

/**
 * Patient Profile
 * GET /api/patients/me response
 */
export interface PatientProfileDto {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  documentType: string | null;
  documentNumber: string | null;
  dateOfBirth: string; // YYYY-MM-DD
  gender: string | null;
  bloodType: BloodType | string | null;
  countryId: string | null;
  cityId: string | null;
  countryName: string | null;
  cityName: string | null;
  addressLine1: string | null;
  shareFullHistoryWithTreatingProfessionals: boolean;
  isActive: boolean;
  dateCreated: string;
}

/**
 * Address
 */
export interface AddressDto {
  street: string;
  city: string;
  state?: string;
  zipCode?: string;
  country: string;
}

/**
 * Emergency Contact
 */
export interface EmergencyContactDto {
  name: string;
  relationship: string;
  phone: string;
  alternativePhone?: string;
}

/**
 * Blood Type
 */
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

/**
 * Create Patient Profile Request
 * POST /api/patients/me body
 */
export interface CreatePatientProfileDto {
  fullName: string;
  email: string;
  phone: string;
  documentType?: string | null;
  documentNumber?: string | null;
  dateOfBirth: string;
  gender?: string | null;
  bloodType?: BloodType | string | null;
  countryId?: string | null;
  cityId?: string | null;
  countryName?: string | null;
  cityName?: string | null;
  addressLine1?: string | null;
}

/**
 * Update Patient Profile Request
 * PUT /api/patients/me body
 */
export interface UpdatePatientProfileDto extends Partial<CreatePatientProfileDto> {}

/**
 * Check if profile is complete (required fields filled)
 */
export function isProfileComplete(profile: PatientProfileDto | null): boolean {
  if (!profile) return false;

  return !!(
    profile.fullName &&
    profile.email &&
    profile.dateOfBirth &&
    profile.phone &&
    profile.addressLine1 &&
    profile.cityName &&
    profile.countryName
  );
}

/**
 * Calculate profile completion percentage
 */
export function calculateCompletionPercentage(
  profile: PatientProfileDto | null,
): number {
  if (!profile) return 0;

  const fields = [
    profile.fullName,
    profile.email,
    profile.dateOfBirth,
    profile.phone,
    profile.addressLine1,
    profile.cityName,
    profile.countryName,
    profile.bloodType,
    profile.gender,
    profile.documentType,
  ];

  const filledFields = fields.filter((f) => !!f).length;
  return Math.round((filledFields / fields.length) * 100);
}
