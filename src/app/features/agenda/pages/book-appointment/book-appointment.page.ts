import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import {
  AppointmentsApi,
  ProfessionalAvailabilityApi,
  ProfessionalsPublicApi,
  type SlotItemDto,
} from '@data/api';
import { PAGE_SIZE_LARGE } from '@shared/constants/pagination.constants';
import { type PaginatedProfessionalsResponse } from '@data/models';

const OBSERVATION_MIN_NON_WHITESPACE = 10;
const OBSERVATION_MAX_LENGTH = 1000;

function minNonWhitespaceLengthValidator(minLength: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? '');
    const actualLength = value.replace(/\s/g, '').length;

    return actualLength >= minLength
      ? null
      : {
          minNonWhitespaceLength: {
            requiredLength: minLength,
            actualLength,
          },
        };
  };
}

/**
 * Book Appointment Page
 *
 * Multi-step form for booking an appointment:
 * 1. Select professional
 * 2. Select date
 * 3. Add optional consultation notes
 * 4. Select time slot
 * 5. Confirm and create
 *
 * Features:
 * - Loads available professionals
 * - Fetches available slots via ProfessionalAvailabilityApi.getGeneratedSlots
 * - I-11: Displays slot times in the patient's browser timezone.
 *         When the professional is in a different timezone, also shows
 *         the professional's local time so there is no ambiguity.
 * - Creates appointment with UTC time
 */

@Component({
  selector: 'app-book-appointment-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatStepperModule,
    MatNativeDateModule,
  ],
  templateUrl: './book-appointment.page.html',
  styleUrl: './book-appointment.page.scss',
})
export class BookAppointmentPageComponent {
  private readonly appointmentsApi = inject(AppointmentsApi);
  private readonly availabilityApi = inject(ProfessionalAvailabilityApi);
  private readonly professionalsApi = inject(ProfessionalsPublicApi);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  // State
  readonly loading = signal(false);
  readonly loadingSlots = signal(false);
  readonly loadProfessionalsError = signal(false); // A-02
  readonly loadSlotsError = signal(false);         // A-02
  readonly professionals = signal<any[]>([]);
  readonly availableSlots = signal<SlotItemDto[]>([]);
  readonly creating = signal(false);

  /**
   * I-11: IANA timezone reported by the professional's availability template.
   * Set each time slots are loaded; empty string if unknown.
   */
  readonly professionalTimezone = signal<string>('');

  /**
   * I-11: Browser (patient) IANA timezone — read once at component creation.
   * e.g. "America/New_York", "America/Tegucigalpa"
   */
  readonly browserTimezone: string =
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  /**
   * I-11: True when the professional is in a different timezone than the patient.
   * Used to conditionally render the timezone disambiguation note.
   */
  readonly showProfessionalTz = computed(() => {
    const profTz = this.professionalTimezone();
    return !!profTz && profTz !== this.browserTimezone;
  });

  // Forms
  readonly professionalForm: FormGroup;
  readonly dateForm: FormGroup;
  readonly slotForm: FormGroup;
  readonly observationForm: FormGroup;

  // Computed
  readonly selectedDate = computed(() => this.dateForm.value.date);
  readonly selectedSlot = computed(() => this.slotForm.value.slot as SlotItemDto | null);

  // Min date (today)
  readonly minDate = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  })();

  constructor() {
    // Initialize forms
    this.professionalForm = this.fb.group({
      professionalId: ['', Validators.required],
    });

    this.dateForm = this.fb.group({
      date: ['', Validators.required],
    });

    this.slotForm = this.fb.group({
      slot: ['', Validators.required],
    });

    this.observationForm = this.fb.group({
      observation: [
        '',
        [
          Validators.required,
          Validators.maxLength(OBSERVATION_MAX_LENGTH),
          minNonWhitespaceLengthValidator(OBSERVATION_MIN_NON_WHITESPACE),
        ],
      ],
    });

    // Load professionals on init
    this.loadProfessionals();

    // Watch date changes to load slots
    this.dateForm.get('date')?.valueChanges.subscribe((date) => {
      if (date && this.professionalForm.valid) {
        this.loadAvailableSlots();
      }
    });
  }

  /**
   * Load available professionals
   * Note: Using public API for simplicity
   */
  loadProfessionals(): void {
    this.loading.set(true);
    this.loadProfessionalsError.set(false); // A-02: clear previous error

    this.professionalsApi
      .searchProfessionals({ page: 1, pageSize: PAGE_SIZE_LARGE })
      .subscribe({
        next: (response: PaginatedProfessionalsResponse) => {
          this.professionals.set(response.items);
          this.loading.set(false);
        },
        error: () => {
          this.loadProfessionalsError.set(true); // A-02
          this.loading.set(false);
        },
      });
  }

  /**
   * Load available slots for selected professional and date.
   *
   * I-11: Uses ProfessionalAvailabilityApi.getGeneratedSlots which returns
   * SlotResponseDto with a `timeZone` field and `items` containing both
   * `startUtc` (for browser-TZ conversion) and `startLocal` (professional's TZ).
   */
  loadAvailableSlots(): void {
    const professionalId = this.professionalForm.value.professionalId;
    const date = this.dateForm.value.date as Date;

    if (!professionalId || !date) return;

    this.loadingSlots.set(true);
    this.loadSlotsError.set(false); // A-02: clear previous error
    this.availableSlots.set([]);
    this.professionalTimezone.set('');
    this.slotForm.reset();

    // Convert date to ISO string format (YYYY-MM-DD)
    const dateStr = date.toISOString().split('T')[0];

    this.availabilityApi
      .getGeneratedSlots(professionalId, dateStr)
      .subscribe({
        next: (response) => {
          // I-11: store professional timezone for display
          this.professionalTimezone.set(response.timeZone ?? '');
          // Backend only returns available slots — no need to filter
          this.availableSlots.set(response.items ?? []);
          this.loadingSlots.set(false);
        },
        error: () => {
          this.loadSlotsError.set(true); // A-02
          this.loadingSlots.set(false);
        },
      });
  }

  /**
   * Create appointment
   */
  createAppointment(): void {
    if (
      !this.professionalForm.valid ||
      !this.dateForm.valid ||
      !this.slotForm.valid ||
      !this.observationForm.valid
    ) {
      return;
    }

    this.creating.set(true);

    const professionalId = this.professionalForm.value.professionalId;
    const slot = this.slotForm.value.slot as SlotItemDto;
    const observation =
      (this.observationForm.value.observation as string | undefined)?.trim() ||
      undefined;

    this.appointmentsApi
      .createAppointment({
        professionalId,
        startTime: slot.startUtc, // UTC ISO 8601 (I-11: from SlotItemDto.startUtc)
        Observation: observation,
      })
      .subscribe({
        next: (response) => {
          this.creating.set(false);
          // Navigate to appointment detail
          this.router.navigate(['/dashboard/agenda', response.appointment.id]);
        },
        error: () => {
          // Error handled by interceptor (toast shown)
          this.creating.set(false);
        },
      });
  }

  /**
   * Cancel and go back
   */
  cancel(): void {
    this.router.navigate(['/dashboard/agenda']);
  }

  /**
   * I-11: Format a slot's start time for display.
   *
   * Primary: patient's browser local time (from startUtc).
   * Secondary (only when TZs differ): professional's local time appended
   * as "· HH:mm (City)" so there is no ambiguity about which timezone
   * the calendar shows.
   *
   * Example (patient in New York, doctor in Tegucigalpa):
   *   "10:00 · 09:00 (Tegucigalpa)"
   */
  formatSlotTime(slot: SlotItemDto): string {
    const utcDate = new Date(slot.startUtc);

    const browserTime = utcDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: this.browserTimezone,
    });

    const profTz = this.professionalTimezone();
    if (profTz && profTz !== this.browserTimezone) {
      // Prefer startLocal from backend (already in professional's TZ).
      // It may be "HH:mm" or a full datetime — extract the time part.
      const localStr = String(slot.startLocal ?? '');
      const match = /(\d{1,2}:\d{2})/.exec(localStr);
      const profTime = match
        ? match[1]
        : utcDate.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: profTz,
          });

      return `${browserTime} · ${profTime} (${this.shortTzName(profTz)})`;
    }

    return browserTime;
  }

  /**
   * I-11: Returns a short human-readable label from an IANA timezone string.
   * e.g. "America/Tegucigalpa" → "Tegucigalpa"
   *      "America/New_York"    → "New York"
   */
  shortTzName(tz: string): string {
    return (tz.split('/').pop() ?? tz).replaceAll('_', ' ');
  }

  /**
   * Get professional name by ID
   */
  getProfessionalName(id: string): string {
    const prof = this.professionals().find((p) => p.id === id);
    return prof ? `${prof.firstName} ${prof.lastName}` : '';
  }
}
