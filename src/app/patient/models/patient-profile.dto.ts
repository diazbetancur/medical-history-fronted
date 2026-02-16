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
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  phone: string;
  email: string;
  address?: AddressDto;
  bloodType?: BloodType;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  hasInsurance: boolean;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  emergencyContact?: EmergencyContactDto;
  isProfileComplete: boolean;
  createdAt: string;
  updatedAt: string;
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
export interface CreatePatientProfileDto extends Omit<
  PatientProfileDto,
  'id' | 'userId' | 'email' | 'isProfileComplete' | 'createdAt' | 'updatedAt'
> {}

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
    profile.firstName &&
    profile.lastName &&
    profile.dateOfBirth &&
    profile.phone &&
    profile.address?.street &&
    profile.address?.city &&
    profile.address?.country
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
    profile.firstName,
    profile.lastName,
    profile.dateOfBirth,
    profile.phone,
    profile.address?.street,
    profile.address?.city,
    profile.address?.country,
    profile.bloodType,
    profile.allergies?.length,
    profile.hasInsurance ? profile.insuranceProvider : 'not_required',
    profile.emergencyContact?.name,
  ];

  const filledFields = fields.filter((f) => !!f).length;
  return Math.round((filledFields / fields.length) * 100);
}
