import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import type {
  PatientProfileDto,
  UpdatePatientProfileDto,
} from '../models/patient-profile.models';
import { ApiClient } from './api-client';

/**
 * API para gestionar el perfil del paciente autenticado
 * Endpoint base: /patients/me
 */
@Injectable({ providedIn: 'root' })
export class PatientsApi {
  constructor(private apiClient: ApiClient) {}

  /**
   * Obtiene el perfil completo del paciente autenticado
   * Usa el token JWT para identificar al usuario
   */
  getMyProfile(): Observable<PatientProfileDto> {
    return this.apiClient.get<PatientProfileDto>('/patients/me');
  }

  /**
   * Actualiza el perfil del paciente autenticado
   * Solo actualiza los campos proporcionados (partial update)
   */
  updateMyProfile(dto: UpdatePatientProfileDto): Observable<PatientProfileDto> {
    return this.apiClient.put<PatientProfileDto>('/patients/me', dto);
  }

  /**
   * Verifica si el perfil del paciente está completo
   */
  checkProfileCompleteness(): Observable<{
    isComplete: boolean;
    missingFields: string[];
  }> {
    return this.apiClient.get<{ isComplete: boolean; missingFields: string[] }>(
      '/patients/me/completeness',
    );
  }
}
