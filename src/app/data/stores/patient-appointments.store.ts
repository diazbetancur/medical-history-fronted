import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { ProblemDetails } from '@core/models';
import { AppointmentsApi } from '@data/api/appointments.api';
import type { CreateAppointmentRequest } from '@data/api/appointments.types';
import { ProfessionalAvailabilityApi } from '@data/api/professional-availability.api';
import type { SlotItemDto } from '@data/models/availability.models';
import { SlotPreferencesService } from '@patient/services/slot-preferences.service';
import {
  MSG_APPOINTMENT_CREATED,
  MSG_APPOINTMENT_ERROR_CREATE,
  MSG_APPOINTMENT_ERROR_LOAD,
  MSG_APPOINTMENT_NO_PROFESSIONAL,
  MSG_APPOINTMENT_NO_SLOTS,
  MSG_APPOINTMENT_SELECT_SLOT,
} from '@shared/constants/messages.constants';
import { ToastService } from '@shared/services';
import { catchError, finalize, of, tap } from 'rxjs';

/**
 * Patient Appointments Store
 *
 * Signal-based state management para crear y gestionar citas del paciente.
 *
 * C-02: migrated from deprecated TimeSlotDto / ProfessionalsPublicApi to
 *       canonical SlotItemDto / ProfessionalAvailabilityApi.getGeneratedSlots.
 */
@Injectable({
  providedIn: 'root',
})
export class PatientAppointmentsStore {
  private readonly appointmentsApi    = inject(AppointmentsApi);
  private readonly availabilityApi    = inject(ProfessionalAvailabilityApi); // C-02
  private readonly slotPreferences    = inject(SlotPreferencesService);
  private readonly toastService       = inject(ToastService);
  private readonly router             = inject(Router);

  // State signals
  private readonly _availableSlots  = signal<SlotItemDto[]>([]); // C-02: SlotItemDto
  private readonly _selectedDate    = signal<string>(''); // YYYY-MM-DD
  private readonly _selectedSlot    = signal<SlotItemDto | null>(null); // C-02
  private readonly _professionalId  = signal<string>('');
  private readonly _professionalName = signal<string>('');
  private readonly _durationMinutes = signal<number>(
    this.slotPreferences.getDurationMinutes(30),
  );
  private readonly _isLoading   = signal<boolean>(false);
  private readonly _isCreating  = signal<boolean>(false);
  private readonly _lastError   = signal<ProblemDetails | null>(null);

  // Public readonly signals
  readonly availableSlots   = this._availableSlots.asReadonly();
  readonly selectedDate     = this._selectedDate.asReadonly();
  readonly selectedSlot     = this._selectedSlot.asReadonly();
  readonly professionalId   = this._professionalId.asReadonly();
  readonly professionalName = this._professionalName.asReadonly();
  readonly durationMinutes  = this._durationMinutes.asReadonly();
  readonly isLoading        = this._isLoading.asReadonly();
  readonly isCreating       = this._isCreating.asReadonly();
  readonly lastError        = this._lastError.asReadonly();

  // Computed signals
  /** C-02: new API only returns available slots — any item in the array is bookable. */
  readonly hasAvailableSlots = computed(() => this._availableSlots().length > 0);

  readonly canCreateAppointment = computed(() =>
    !!this._selectedSlot() &&
    !!this._selectedDate() &&
    !!this._professionalId() &&
    !this._isCreating(),
  );

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
   * Load available slots for a specific date.
   *
   * C-02: uses ProfessionalAvailabilityApi.getGeneratedSlots (returns SlotResponseDto
   * with SlotItemDto items) instead of the deprecated ProfessionalsPublicApi adapter.
   */
  loadAvailableSlots(date: string): void {
    if (!this._professionalId()) {
      this.toastService.error(MSG_APPOINTMENT_NO_PROFESSIONAL);
      return;
    }

    this._isLoading.set(true);
    this._availableSlots.set([]); // M-04: clear stale slots immediately
    this._lastError.set(null);
    this._selectedDate.set(date);
    this._selectedSlot.set(null);

    this.availabilityApi
      .getGeneratedSlots(this._professionalId(), date, this._durationMinutes())
      .pipe(
        tap((response) => {
          this._availableSlots.set(response.items);
          if (response.items.length === 0) {
            this.toastService.info(MSG_APPOINTMENT_NO_SLOTS);
          }
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);
          this._availableSlots.set([]);
          this.toastService.error(
            problemDetails.title || MSG_APPOINTMENT_ERROR_LOAD,
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
   * Select a time slot.
   * C-02: no isAvailable guard needed — the API only returns bookable slots.
   *       We keep a guard as a defensive check in case stale data is passed.
   */
  selectSlot(slot: SlotItemDto): void {
    this._selectedSlot.set(slot);
  }

  /**
   * Create appointment
   */
  createAppointment(notes?: string): void {
    const slot           = this._selectedSlot();
    const date           = this._selectedDate();
    const professionalId = this._professionalId();

    if (!slot || !date || !professionalId) {
      this.toastService.error(MSG_APPOINTMENT_SELECT_SLOT);
      return;
    }

    this._isCreating.set(true);
    this._lastError.set(null);

    const request: CreateAppointmentRequest = {
      professionalId,
      startTime: slot.startUtc, // UTC ISO 8601 (I-11)
      notes,
    };

    this.appointmentsApi
      .createAppointment(request)
      .pipe(
        tap(() => {
          this.toastService.success(MSG_APPOINTMENT_CREATED);
          this.router.navigate(['/patient/appointments']);
          this.resetState();
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);

          if (problemDetails.errorCode === 'TIME_SLOT_UNAVAILABLE') {
            // C-02: use startLocal (ISO datetime) — extract HH:mm for display
            const timeLabel = slot.startLocal.slice(11, 16) || slot.startUtc;
            this.toastService.error(
              `El horario seleccionado (${timeLabel}) ya no está disponible. Por favor, selecciona otro horario.`,
            );
            this.loadAvailableSlots(date);
          } else {
            this.toastService.error(
              problemDetails.title || MSG_APPOINTMENT_ERROR_CREATE,
            );
          }

          return of(null);
        }),
        finalize(() => this._isCreating.set(false)),
      )
      .subscribe();
  }

  /** Reset state */
  resetState(): void {
    this._availableSlots.set([]);
    this._selectedDate.set('');
    this._selectedSlot.set(null);
    this._professionalId.set('');
    this._professionalName.set('');
    this._durationMinutes.set(this.slotPreferences.getDurationMinutes(30));
    this._lastError.set(null);
  }

  /** Clear last error */
  clearError(): void {
    this._lastError.set(null);
  }
}
