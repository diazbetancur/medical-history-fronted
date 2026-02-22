/**
 * Professional location (sede) models
 */

export interface ProfessionalLocationDto {
  id: string;
  professionalProfileId?: string;
  name: string;
  address: string | null;
  cityId: string;
  cityName: string | null;
  countryId: string;
  countryName: string | null;
  phone: string | null;
  isDefault: boolean;
  isActive: boolean;
  dateCreated: string;

  floor?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  formattedAddress?: string;
}

export interface CreateProfessionalLocationDto {
  name: string;
  cityId: string;
  countryId: string;
  address?: string;
  phone?: string;

  floor?: string;
  cityName?: string;
  countryName?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}
