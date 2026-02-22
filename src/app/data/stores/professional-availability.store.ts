import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthStore } from '@core/auth/auth.store';
import type { ProblemDetails } from '@core/models';
import { ProfessionalAvailabilityApi } from '@data/api/professional-availability.api';
import type {
  AbsenceDto,
  AbsenceFilters,
  CreateAbsenceDto,
} from '@data/models/professional-absence.models';
import type { ProfessionalLocationDto } from '@data/models/professional-location.models';
import type {
  DaySchedule,
  WeeklyScheduleDto,
} from '@data/models/professional-schedule.models';
import { ToastService } from '@shared/services';
import { catchError, finalize, of, tap } from 'rxjs';

/**
 * Professional Availability Store
 *
 * Signal-based state management para horarios y disponibilidad del profesional.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfessionalAvailabilityStore {
  private readonly availabilityApi = inject(ProfessionalAvailabilityApi);
  private readonly toastService = inject(ToastService);
  private readonly authStore = inject(AuthStore);

  // State signals - Weekly Schedule
  private readonly _weeklySchedule = signal<WeeklyScheduleDto | null>(null);
  private readonly _isLoadingSchedule = signal<boolean>(false);

  // State signals - Absences
  private readonly _absences = signal<AbsenceDto[]>([]);
  private readonly _isLoadingAbsences = signal<boolean>(false);

  // State signals - Locations
  private readonly _locations = signal<ProfessionalLocationDto[]>([]);
  private readonly _isLoadingLocations = signal<boolean>(false);

  // State signals - Common
  private readonly _lastError = signal<ProblemDetails | null>(null);
  private readonly _isSaving = signal<boolean>(false);

  // Public readonly signals - Schedule
  readonly weeklySchedule = this._weeklySchedule.asReadonly();
  readonly isLoadingSchedule = this._isLoadingSchedule.asReadonly();

  // Public readonly signals - Absences
  readonly absences = this._absences.asReadonly();
  readonly isLoadingAbsences = this._isLoadingAbsences.asReadonly();

  // Public readonly signals - Locations
  readonly locations = this._locations.asReadonly();
  readonly isLoadingLocations = this._isLoadingLocations.asReadonly();

  // Public readonly signals - Common
  readonly lastError = this._lastError.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();

  // Computed signals
  readonly hasSchedule = computed(() => this._weeklySchedule() !== null);

  readonly workingDays = computed(() => {
    const schedule = this._weeklySchedule();
    if (!schedule) return [];
    return schedule.days.filter((day) => day.isWorkingDay);
  });

  readonly futureAbsences = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this._absences().filter(
      (absence) => absence.endDateTime.slice(0, 10) >= today,
    );
  });

  readonly isLoading = computed(
    () =>
      this._isLoadingSchedule() ||
      this._isLoadingAbsences() ||
      this._isLoadingLocations(),
  );

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Inicializar store (cargar horario y ausencias futuras)
   */
  initialize(): void {
    const professionalId = this.getProfessionalIdOrNotify();
    if (!professionalId) {
      return;
    }

    this.loadWeeklySchedule(professionalId);
    this.loadFutureAbsences(professionalId);
    this.loadLocations();
  }

  loadLocations(includeInactive = false): void {
    this._isLoadingLocations.set(true);
    this._lastError.set(null);

    this.availabilityApi
      .getProfessionalLocations(includeInactive)
      .pipe(
        tap((locations) => {
          this._locations.set(locations ?? []);
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);
          this._locations.set([]);
          this.toastService.error(
            problemDetails.title || 'Error al cargar sedes',
          );
          return of(null);
        }),
        finalize(() => this._isLoadingLocations.set(false)),
      )
      .subscribe();
  }

  // ============================================================================
  // WEEKLY SCHEDULE
  // ============================================================================

  /**
   * Cargar horario semanal
   */
  loadWeeklySchedule(professionalId?: string): void {
    const profileId = professionalId ?? this.getProfessionalIdOrNotify();
    if (!profileId) {
      return;
    }

    this._isLoadingSchedule.set(true);
    this._lastError.set(null);

    this.availabilityApi
      .getWeeklySchedule(profileId)
      .pipe(
        tap((schedule) => {
          this._weeklySchedule.set(schedule);
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);

          // Si no existe horario (404), usar default
          if (problemDetails.status === 404) {
            this.toastService.info(
              'No tienes horario configurado. Usa el horario por defecto como base.',
            );
          } else {
            this.toastService.error(
              problemDetails.title || 'Error al cargar horario',
            );
          }

          return of(null);
        }),
        finalize(() => this._isLoadingSchedule.set(false)),
      )
      .subscribe();
  }

  /**
   * Actualizar horario semanal
   */
  updateWeeklySchedule(
    days: DaySchedule[],
    slotDuration?: number,
    timeZone?: string,
    isActive?: boolean,
  ): void {
    const professionalId = this.getProfessionalIdOrNotify();
    if (!professionalId) {
      return;
    }

    this._isSaving.set(true);
    this._lastError.set(null);

    this.availabilityApi
      .updateWeeklySchedule(professionalId, {
        days,
        defaultSlotDuration: slotDuration,
        timeZone,
        isActive,
      })
      .pipe(
        tap((schedule) => {
          this._weeklySchedule.set(schedule);
          this.toastService.success('Horario actualizado exitosamente');
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);
          this.toastService.error(
            problemDetails.title || 'Error al actualizar horario',
          );
          return of(null);
        }),
        finalize(() => this._isSaving.set(false)),
      )
      .subscribe();
  }

  // ============================================================================
  // ABSENCES
  // ============================================================================

  /**
   * Cargar ausencias futuras (desde hoy)
   */
  loadFutureAbsences(professionalId?: string): void {
    const today = new Date().toISOString().split('T')[0] + 'T00:00:00Z';
    this.loadAbsences({ startDateTime: today }, professionalId);
  }

  /**
   * Cargar ausencias con filtros
   */
  loadAbsences(filters?: AbsenceFilters, professionalId?: string): void {
    const profileId = professionalId ?? this.getProfessionalIdOrNotify();
    if (!profileId) {
      return;
    }

    this._isLoadingAbsences.set(true);
    this._lastError.set(null);

    this.availabilityApi
      .getAbsences(profileId, filters)
      .pipe(
        tap((response) => {
          this._absences.set(response.items);
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);
          this._absences.set([]);
          this.toastService.error(
            problemDetails.title || 'Error al cargar ausencias',
          );
          return of(null);
        }),
        finalize(() => this._isLoadingAbsences.set(false)),
      )
      .subscribe();
  }

  /**
   * Crear ausencia
   */
  createAbsence(dto: CreateAbsenceDto): void {
    const professionalId = this.getProfessionalIdOrNotify();
    if (!professionalId) {
      return;
    }

    this._isSaving.set(true);
    this._lastError.set(null);

    this.availabilityApi
      .createAbsence(professionalId, dto)
      .pipe(
        tap((absence) => {
          this._absences.update((absences) => [...absences, absence]);
          this.toastService.success('Ausencia creada exitosamente');
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);
          this.toastService.error(
            problemDetails.title || 'Error al crear ausencia',
          );
          return of(null);
        }),
        finalize(() => this._isSaving.set(false)),
      )
      .subscribe();
  }

  /**
   * Eliminar ausencia
   */
  deleteAbsence(absenceId: string): void {
    const professionalId = this.getProfessionalIdOrNotify();
    if (!professionalId) {
      return;
    }

    this._isSaving.set(true);

    this.availabilityApi
      .deleteAbsence(professionalId, absenceId)
      .pipe(
        tap(() => {
          this._absences.update((absences) =>
            absences.filter((a) => a.id !== absenceId),
          );
          this.toastService.success('Ausencia eliminada exitosamente');
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this.toastService.error(
            problemDetails.title || 'Error al eliminar ausencia',
          );
          return of(null);
        }),
        finalize(() => this._isSaving.set(false)),
      )
      .subscribe();
  }

  /**
   * Limpiar errores
   */
  clearError(): void {
    this._lastError.set(null);
  }

  private getProfessionalIdOrNotify(): string | null {
    const professionalId = this.authStore.user()?.professionalProfileId ?? null;
    if (!professionalId) {
      this.toastService.error('No se encontró perfil profesional');
      return null;
    }

    return professionalId;
  }
}
