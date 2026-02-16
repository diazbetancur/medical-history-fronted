import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
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
  ProfessionalsPublicApi,
  type TimeSlot,
} from '@data/api';
import { type PaginatedProfessionalsResponse } from '@data/models';

/**
 * Book Appointment Page
 *
 * Multi-step form for booking an appointment:
 * 1. Select professional
 * 2. Select date
 * 3. Select time slot
 * 4. Add notes (optional)
 * 5. Confirm and create
 *
 * Features:
 * - Loads available professionals
 * - Fetches available slots for selected date
 * - Converts UTC slots to local time for display
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
  private readonly professionalsApi = inject(ProfessionalsPublicApi);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  // State
  readonly loading = signal(false);
  readonly loadingSlots = signal(false);
  readonly professionals = signal<any[]>([]);
  readonly availableSlots = signal<TimeSlot[]>([]);
  readonly creating = signal(false);

  // Forms
  readonly professionalForm: FormGroup;
  readonly dateForm: FormGroup;
  readonly slotForm: FormGroup;
  readonly notesForm: FormGroup;

  // Computed
  readonly selectedDate = computed(() => this.dateForm.value.date);
  readonly selectedSlot = computed(() => this.slotForm.value.slot);

  // Min date (today)
  readonly minDate = new Date();

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

    this.notesForm = this.fb.group({
      notes: ['', Validators.maxLength(500)],
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

    // Get professionals from public search
    // In production, you'd have a dedicated endpoint
    this.professionalsApi.searchProfessionals({ page: 1, pageSize: 50 }).subscribe({
      next: (response: PaginatedProfessionalsResponse) => {
        this.professionals.set(response.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  /**
   * Load available slots for selected professional and date
   */
  loadAvailableSlots(): void {
    const professionalId = this.professionalForm.value.professionalId;
    const date = this.dateForm.value.date as Date;

    if (!professionalId || !date) return;

    this.loadingSlots.set(true);
    this.availableSlots.set([]);
    this.slotForm.reset();

    // Convert date to ISO string format (YYYY-MM-DD)
    const dateStr = date.toISOString().split('T')[0];

    this.appointmentsApi
      .getAvailableSlots({
        professionalId,
        date: dateStr,
      })
      .subscribe({
        next: (response) => {
          // Filter only available slots
          const available = response.slots.filter((slot) => slot.available);
          this.availableSlots.set(available);
          this.loadingSlots.set(false);
        },
        error: () => {
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
      !this.slotForm.valid
    ) {
      return;
    }

    this.creating.set(true);

    const professionalId = this.professionalForm.value.professionalId;
    const slot = this.slotForm.value.slot as TimeSlot;
    const notes = this.notesForm.value.notes || undefined;

    this.appointmentsApi
      .createAppointment({
        professionalId,
        startTime: slot.startTime, // Already in UTC
        notes,
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
   * Convert UTC time to local time string (short format)
   */
  toLocalTime(utcTime: string): string {
    const date = new Date(utcTime);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get professional name by ID
   */
  getProfessionalName(id: string): string {
    const prof = this.professionals().find((p) => p.id === id);
    return prof ? `${prof.firstName} ${prof.lastName}` : '';
  }
}
