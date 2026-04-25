import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { ProblemDetails } from '@core/models';
import { AppointmentsApi } from '@data/api/appointments.api';
import type { CreateAppointmentRequest } from '@data/api/appointments.types';
import { ProfessionalsPublicApi } from '@data/api/professionals-public.api';
import type { TimeSlotDto } from '@data/models/availability.models';
import { SlotPreferencesService } from '@patient/services/slot-preferences.service';
import { ToastService } from '@shared/services';
import { catchError, finalize, of, tap } from 'rxjs';

/**
 * Patient Appointments Store
 *
 * Signal-based state management para crear y gestionar citas del paciente.
 */
@Injectable({
  providedIn: 'root',
})
export class PatientAppointmentsStore {
  private readonly appointmentsApi = inject(AppointmentsApi);
  private readonly professionalsApi = inject(ProfessionalsPublicApi);
  private readonly slotPreferences = inject(SlotPreferencesService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  // State signals
  private readonly _availableSlots = signal<TimeSlotDto[]>([]);
  private readonly _selectedDate = signal<string>(''); // YYYY-MM-DD
  private readonly _selectedSlot = signal<TimeSlotDto | null>(null);
  private readonly _professionalId = signal<string>('');
  private readonly _professionalName = signal<string>('');
  private readonly _durationMinutes = signal<number>(
    this.slotPreferences.getDurationMinutes(30),
  );
  private readonly _isLoading = signal<boolean>(false);
  private readonly _isCreating = signal<boolean>(false);
  private readonly _lastError = signal<ProblemDetails | null>(null);

  // Public readonly signals
  readonly availableSlots = this._availableSlots.asReadonly();
  readonly selectedDate = this._selectedDate.asReadonly();
  readonly selectedSlot = this._selectedSlot.asReadonly();
  readonly professionalId = this._professionalId.asReadonly();
  readonly professionalName = this._professionalName.asReadonly();
  readonly durationMinutes = this._durationMinutes.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isCreating = this._isCreating.asReadonly();
  readonly lastError = this._lastError.asReadonly();

  // Computed signals
  readonly hasAvailableSlots = computed(() => {
    return this._availableSlots().some((slot) => slot.isAvailable);
  });

  readonly canCreateAppointment = computed(() => {
    return (
      !!this._selectedSlot() &&
      !!this._selectedDate() &&
      !!this._professionalId() &&
      !this._isCreating()
    );
  });

  /**
   * Initialize appointment creation flow
   */
  initializeAppointmentFlow(
    professionalId: string,
    professionalName: string,
    durationMinutes?: number,
  ): void {
    this._professionalId.set(professionalId);
    this._professionalName.set(professionalName);
    this._durationMinutes.set(
      durationMinutes ?? this.slotPreferences.getDurationMinutes(30),
    );
    this._selectedDate.set('');
    this._selectedSlot.set(null);
    this._availableSlots.set([]);
    this._lastError.set(null);
  }

  /**
   * Load available slots for a specific date
   */
  loadAvailableSlots(date: string): void {
    if (!this._professionalId()) {
      this.toastService.error('No se ha seleccionado un profesional');
      return;
    }

    this._isLoading.set(true);
    this._lastError.set(null);
    this._selectedDate.set(date);
    this._selectedSlot.set(null);

    this.professionalsApi
      .getAvailabilitySlots(
        this._professionalId(),
        date,
        this._durationMinutes(),
      )
      .pipe(
        tap((response) => {
          this._availableSlots.set(response.slots);
          if (
            response.slots.length === 0 ||
            !response.slots.some((s) => s.isAvailable)
          ) {
            this.toastService.info(
              'No hay horarios disponibles para esta fecha',
            );
          }
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);
          this._availableSlots.set([]);
          this.toastService.error(
            problemDetails.title || 'Error al cargar disponibilidad',
          );
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  setDurationMinutes(durationMinutes: number): void {
    this._durationMinutes.set(durationMinutes);
    this.slotPreferences.setDurationMinutes(durationMinutes);
  }

  /**
   * Select a time slot
   */
  selectSlot(slot: TimeSlotDto): void {
    if (!slot.isAvailable) {
      this.toastService.warning('Este horario ya no está disponible');
      return;
    }
    this._selectedSlot.set(slot);
  }

  /**
   * Create appointment
   */
  createAppointment(notes?: string): void {
    const slot = this._selectedSlot();
    const date = this._selectedDate();
    const professionalId = this._professionalId();

    if (!slot || !date || !professionalId) {
      this.toastService.error('Por favor selecciona una fecha y horario');
      return;
    }

    this._isCreating.set(true);
    this._lastError.set(null);

    // Combine date and time into UTC ISO string
    const request: CreateAppointmentRequest = {
      professionalId,
      startTime: slot.startUtc,
      notes,
    };

    this.appointmentsApi
      .createAppointment(request)
      .pipe(
        tap((response) => {
          this.toastService.success('¡Cita creada exitosamente!');

          // Navigate to appointments list
          this.router.navigate(['/patient/appointments']);

          // Clear state
          this.resetState();
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);

          // Manejo especial para TIME_SLOT_UNAVAILABLE
          if (problemDetails.errorCode === 'TIME_SLOT_UNAVAILABLE') {
            this.toastService.error(
              `El horario seleccionado (${slot.startTime}) ya no está disponible. Por favor, selecciona otro horario.`,
            );
            // Recargar slots
            this.loadAvailableSlots(date);
          } else {
            this.toastService.error(
              problemDetails.title || 'Error al crear la cita',
            );
          }

          return of(null);
        }),
        finalize(() => this._isCreating.set(false)),
      )
      .subscribe();
  }

  /**
   * Reset state
   */
  resetState(): void {
    this._availableSlots.set([]);
    this._selectedDate.set('');
    this._selectedSlot.set(null);
    this._professionalId.set('');
    this._professionalName.set('');
    this._durationMinutes.set(this.slotPreferences.getDurationMinutes(30));
    this._lastError.set(null);
  }

  /**
   * Clear last error
   */
  clearError(): void {
    this._lastError.set(null);
  }

  /**
   * Check if running in production
   */
  private isProduction(): boolean {
    return (
      !window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1')
    );
  }
}
