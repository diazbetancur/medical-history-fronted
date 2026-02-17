/**
 * Modelos para el perfil del paciente
 * Endpoints: /patients/me
 */

/**
 * DTO completo del perfil del paciente
 */
export interface PatientProfileDto {
  id: string;
  userId: string;

  // Información personal
  firstName: string;
  lastName: string;
  dateOfBirth?: string; // YYYY-MM-DD
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

  // Contacto
  phone?: string;
  email: string; // Del user

  // Dirección
  address?: AddressDto;

  // Salud
  bloodType?: BloodType;
  allergies?: string[]; // Array de alergias conocidas
  chronicConditions?: string[]; // Condiciones crónicas
  currentMedications?: string[]; // Medicamentos actuales

  // Seguro médico
  hasInsurance: boolean;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;

  // Contacto de emergencia
  emergencyContact?: EmergencyContactDto;

  // Estado del perfil
  isProfileComplete: boolean; // Si todos los campos requeridos están completos

  createdAt: string;
  updatedAt: string;
}

/**
 * Dirección del paciente
 */
export interface AddressDto {
  street: string;
  city: string;
  state?: string;
  zipCode?: string;
  country: string;
}

/**
 * Contacto de emergencia
 */
export interface EmergencyContactDto {
  name: string;
  relationship: string; // "Madre", "Padre", "Hermano/a", "Cónyuge", "Amigo/a", etc.
  phone: string;
  alternativePhone?: string;
}

/**
 * Tipos de sangre
 */
export type BloodType =
  | 'A_POSITIVE'
  | 'A_NEGATIVE'
  | 'B_POSITIVE'
  | 'B_NEGATIVE'
  | 'AB_POSITIVE'
  | 'AB_NEGATIVE'
  | 'O_POSITIVE'
  | 'O_NEGATIVE';

/**
 * Labels de tipos de sangre en español
 */
export const BLOOD_TYPE_LABELS: Record<BloodType, string> = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-',
};

/**
 * Opciones de género
 */
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

/**
 * Labels de género en español
 */
export const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
  OTHER: 'Otro',
  PREFER_NOT_TO_SAY: 'Prefiero no decir',
};

/**
 * DTO para actualizar el perfil del paciente
 */
export interface UpdatePatientProfileDto {
  // Información personal
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  gender?: Gender;

  // Contacto
  phone?: string;

  // Dirección
  address?: AddressDto;

  // Salud
  bloodType?: BloodType;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];

  // Seguro médico
  hasInsurance?: boolean;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;

  // Contacto de emergencia
  emergencyContact?: EmergencyContactDto;
}

/**
 * Respuesta de validación del perfil
 */
export interface ProfileCompletenessDto {
  isComplete: boolean;
  missingFields: string[]; // Campos requeridos faltantes
  completionPercentage: number; // 0-100
}

/**
 * Campos requeridos mínimos para considerar el perfil completo
 */
export const REQUIRED_PROFILE_FIELDS = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'phone',
  'address.street',
  'address.city',
  'address.country',
] as const;

/**
 * Helper: Verifica si el perfil está completo
 */
export function isProfileComplete(profile: PatientProfileDto): boolean {
  if (!profile.firstName?.trim()) return false;
  if (!profile.lastName?.trim()) return false;
  if (!profile.dateOfBirth) return false;
  if (!profile.phone?.trim()) return false;
  if (!profile.address) return false;
  if (!profile.address.street?.trim()) return false;
  if (!profile.address.city?.trim()) return false;
  if (!profile.address.country?.trim()) return false;

  return true;
}

/**
 * Helper: Calcula el porcentaje de completitud del perfil
 */
export function calculateProfileCompleteness(
  profile: PatientProfileDto,
): number {
  const fields = [
    profile.firstName,
    profile.lastName,
    profile.dateOfBirth,
    profile.gender,
    profile.phone,
    profile.address?.street,
    profile.address?.city,
    profile.address?.country,
    profile.bloodType,
    profile.emergencyContact?.name,
    profile.emergencyContact?.phone,
  ];

  const filledFields = fields.filter(
    (field) => field && String(field).trim(),
  ).length;
  return Math.round((filledFields / fields.length) * 100);
}
