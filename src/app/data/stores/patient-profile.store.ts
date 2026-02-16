import { computed, inject, Injectable, signal } from '@angular/core';
import { ToastService } from '../../shared/services/toast.service';
import { PatientsApi } from '../api/patients.api';
import type {
  PatientProfileDto,
  UpdatePatientProfileDto,
} from '../models/patient-profile.models';
import {
  calculateProfileCompleteness,
  isProfileComplete,
} from '../models/patient-profile.models';

/**
 * Store para gestionar el perfil del paciente autenticado
 * Patrón: Signal-based store con computed signals para validación
 */
@Injectable({ providedIn: 'root' })
export class PatientProfileStore {
  private readonly api = inject(PatientsApi);
  private readonly toast = inject(ToastService);

  // ============================================================================
  // STATE SIGNALS
  // ============================================================================

  /**
   * Perfil del paciente (null si no está cargado)
   */
  readonly profile = signal<PatientProfileDto | null>(null);

  /**
   * Estado de carga
   */
  readonly isLoading = signal<boolean>(false);

  /**
   * Estado de guardado
   */
  readonly isSaving = signal<boolean>(false);

  /**
   * Último error
   */
  readonly lastError = signal<string | null>(null);

  // ============================================================================
  // COMPUTED SIGNALS
  // ============================================================================

  /**
   * Si el perfil ya fue cargado
   */
  readonly hasProfile = computed(() => this.profile() !== null);

  /**
   * Si el perfil está completo (todos los campos requeridos)
   */
  readonly isProfileComplete = computed(() => {
    const profile = this.profile();
    return profile ? isProfileComplete(profile) : false;
  });

  /**
   * Porcentaje de completitud (0-100)
   */
  readonly completionPercentage = computed(() => {
    const profile = this.profile();
    return profile ? calculateProfileCompleteness(profile) : 0;
  });

  /**
   * Nombre completo del paciente
   */
  readonly fullName = computed(() => {
    const profile = this.profile();
    if (!profile) return '';
    return `${profile.firstName} ${profile.lastName}`.trim();
  });

  /**
   * Si hay alguna operación en curso (carga o guardado)
   */
  readonly isBusy = computed(() => this.isLoading() || this.isSaving());

  // ============================================================================
  // ACTIONS
  // ============================================================================

  /**
   * Carga el perfil del paciente autenticado
   * Usa el token JWT para identificar al usuario
   */
  loadProfile(): void {
    this.isLoading.set(true);
    this.lastError.set(null);

    this.api.getMyProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);

        // Si 404, el perfil no existe aún (usuario nuevo)
        if (error.status === 404) {
          this.lastError.set('PROFILE_NOT_FOUND');
          this.toast.info('Completa tu perfil para comenzar a agendar citas');
        } else {
          this.lastError.set('LOAD_ERROR');
          this.toast.error('Error al cargar tu perfil');
        }
      },
    });
  }

  /**
   * Actualiza el perfil del paciente
   * Solo envía los campos modificados
   *
   * @param dto - Campos a actualizar
   */
  updateProfile(dto: UpdatePatientProfileDto): void {
    this.isSaving.set(true);
    this.lastError.set(null);

    this.api.updateMyProfile(dto).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.isSaving.set(false);
        this.toast.success('Perfil actualizado exitosamente');
      },
      error: (error) => {
        this.isSaving.set(false);

        // Manejo de errores específicos
        const problemDetails = error.error;

        if (problemDetails?.code === 'VALIDATION_ERROR') {
          this.lastError.set('VALIDATION_ERROR');
          this.toast.error('Verifica los datos ingresados');
        } else if (problemDetails?.code === 'INVALID_DATE_OF_BIRTH') {
          this.lastError.set('INVALID_DATE_OF_BIRTH');
          this.toast.error('Fecha de nacimiento inválida');
        } else {
          this.lastError.set('UPDATE_ERROR');
          this.toast.error('Error al actualizar tu perfil');
        }
      },
    });
  }

  /**
   * Limpia el estado del store
   * Útil al cerrar sesión
   */
  clear(): void {
    this.profile.set(null);
    this.isLoading.set(false);
    this.isSaving.set(false);
    this.lastError.set(null);
  }

  /**
   * Verifica si el perfil tiene campos médicos importantes vacíos
   * (Opcional - para mostrar sugerencia de completar info médica)
   */
  hasMedicalInfoMissing = computed(() => {
    const profile = this.profile();
    if (!profile) return true;

    return (
      !profile.bloodType ||
      !profile.allergies?.length ||
      !profile.emergencyContact
    );
  });
}
