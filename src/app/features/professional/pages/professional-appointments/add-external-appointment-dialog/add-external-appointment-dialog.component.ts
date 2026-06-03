import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProfessionalAppointmentsApi } from '@data/api/professional-appointments.api';
import type { AppointmentDto } from '@data/models/appointment.models';

export interface AddExternalAppointmentDialogData {
  professionalProfileId: string;
}

const EXTERNAL_SOURCES = [
  { value: 0, label: 'Teléfono', icon: 'phone' },
  { value: 1, label: 'WhatsApp', icon: 'chat' },
  { value: 2, label: 'Presencial', icon: 'person' },
  { value: 3, label: 'Correo electrónico', icon: 'email' },
  { value: 99, label: 'Otro', icon: 'more_horiz' },
] as const;

@Component({
  selector: 'app-add-external-appointment-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTimepickerModule,
    MatTooltipModule,
  ],
  templateUrl: './add-external-appointment-dialog.component.html',
  styleUrl: './add-external-appointment-dialog.component.scss',
})
export class AddExternalAppointmentDialogComponent {
  private readonly api = inject(ProfessionalAppointmentsApi);
  private readonly dialogRef = inject(
    MatDialogRef<AddExternalAppointmentDialogComponent>,
  );
  private readonly data = inject<AddExternalAppointmentDialogData>(
    MAT_DIALOG_DATA,
  );
  private readonly fb = inject(FormBuilder);

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly sources = EXTERNAL_SOURCES;
  protected readonly minAppointmentDate = this.getTodayDate();
  protected readonly timepickerInterval = '10m';

  protected readonly form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      patientName: [
        '',
        [
          Validators.required,
          this.notBlankValidator(),
          Validators.minLength(2),
          Validators.maxLength(200),
        ],
      ],
      patientEmail: ['', [Validators.email, Validators.maxLength(255)]],
      patientPhone: ['', Validators.maxLength(30)],
      appointmentDate: [null, Validators.required],
      timeSlot: [null, [Validators.required, this.notPastTodayTimeValidator()]],
      durationMinutes: [30, [Validators.min(15), Validators.max(480)]],
      externalSource: [null, Validators.required],
      reason: ['', Validators.maxLength(500)],
      externalNotes: ['', Validators.maxLength(1000)],
    });

    this.form.get('appointmentDate')?.valueChanges.subscribe(() => {
      this.form.get('timeSlot')?.updateValueAndValidity();
    });
  }

  protected canSubmit(): boolean {
    return (
      !this.submitting() &&
      this.form.valid &&
      this.hasRequiredFieldsFilled()
    );
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    const appointmentDate = this.normalizeDateOnly(value.appointmentDate);
    const timeSlot = this.normalizeTimeOnly(value.timeSlot);

    if (!appointmentDate || !timeSlot) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Selecciona una fecha y hora válidas para la cita.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    this.api
      .createExternalAppointment({
        professionalProfileId: this.data.professionalProfileId,
        patientName: value.patientName.trim(),
        patientEmail: value.patientEmail?.trim() || undefined,
        patientPhone: value.patientPhone?.trim() || undefined,
        appointmentDate,
        timeSlot,
        durationMinutes: value.durationMinutes ?? 30,
        externalSource: value.externalSource,
        reason: value.reason?.trim() || undefined,
        externalNotes: value.externalNotes?.trim() || undefined,
      })
      .subscribe({
        next: (appointment: AppointmentDto) => {
          this.submitting.set(false);
          this.dialogRef.close(appointment);
        },
        error: (err: {
          error?: { detail?: string; title?: string; errorCode?: string };
          status?: number;
        }) => {
          this.submitting.set(false);
          this.errorMessage.set(this.getCreateErrorMessage(err));
        },
      });
  }

  protected getDateErrorMessage(): string {
    const control = this.form.get('appointmentDate');

    if (control?.hasError('required')) {
      return 'La fecha es requerida';
    }

    if (control?.hasError('matDatepickerMin')) {
      return 'Selecciona una fecha desde hoy en adelante';
    }

    if (control?.hasError('matDatepickerParse')) {
      return 'Selecciona una fecha válida';
    }

    return 'Fecha inválida';
  }

  protected getTimeErrorMessage(): string {
    const control = this.form.get('timeSlot');

    if (control?.hasError('required')) {
      return 'La hora es requerida';
    }

    if (control?.hasError('matTimepickerParse')) {
      return 'Selecciona una hora válida';
    }

    if (control?.hasError('matTimepickerMin')) {
      return 'Para citas de hoy, selecciona una hora igual o mayor a la actual';
    }

    if (control?.hasError('pastTimeForToday')) {
      return 'Para citas de hoy, selecciona una hora igual o mayor a la actual';
    }

    return 'Hora inválida';
  }

  protected getMinimumTimeForSelectedDate(): string | null {
    const appointmentDate = this.normalizeDateOnly(
      this.form.get('appointmentDate')?.value,
    );

    if (!appointmentDate || !this.isTodayDate(appointmentDate)) {
      return null;
    }

    return this.getCurrentTimeOnly();
  }

  private normalizeDateOnly(value: unknown): string | null {
    if (!value) return null;

    if (typeof value === 'string') {
      return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return this.formatDateOnly(value);
    }

    return null;
  }

  private getTodayDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  private formatDateOnly(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getCreateErrorMessage(error: {
    error?: { detail?: string; title?: string; errorCode?: string };
    status?: number;
  }): string {
    const problem = error.error;

    if (problem?.errorCode === 'TIME_SLOT_UNAVAILABLE') {
      return 'El horario seleccionado no está disponible u ocupado. Elige otra hora.';
    }

    if (
      problem?.detail &&
      problem.detail !== 'An application error has occurred.'
    ) {
      return problem.detail;
    }

    return problem?.title ?? 'Error al crear la cita externa';
  }

  private notPastTodayTimeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const appointmentDate = this.normalizeDateOnly(
        control.parent?.get('appointmentDate')?.value,
      );
      const timeSlot = this.normalizeTimeOnly(control.value);

      if (!appointmentDate || !timeSlot || !this.isTodayDate(appointmentDate)) {
        return null;
      }

      return this.timeToMinutes(timeSlot) >=
        this.timeToMinutes(this.getCurrentTimeOnly())
        ? null
        : { pastTimeForToday: true };
    };
  }

  private notBlankValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = String(control.value ?? '');
      return value.trim().length > 0 ? null : { blank: true };
    };
  }

  private hasRequiredFieldsFilled(): boolean {
    const value = this.form.value;

    return (
      String(value.patientName ?? '').trim().length >= 2 &&
      !!this.normalizeDateOnly(value.appointmentDate) &&
      !!this.normalizeTimeOnly(value.timeSlot) &&
      value.externalSource !== null &&
      value.externalSource !== undefined
    );
  }

  private isTodayDate(dateOnly: string): boolean {
    return dateOnly === this.formatDateOnly(new Date());
  }

  private getCurrentTimeOnly(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes(),
    ).padStart(2, '0')}`;
  }

  private timeToMinutes(value: string): number {
    const [hours = '0', minutes = '0'] = value.split(':');
    return Number(hours) * 60 + Number(minutes);
  }

  private normalizeTimeOnly(value: unknown): string | null {
    if (!value) return null;

    if (typeof value === 'string') {
      const normalized = value.trim();
      return /^([01]\d|2[0-3]):([0-5]\d)$/.test(normalized)
        ? normalized
        : null;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const hours = String(value.getHours()).padStart(2, '0');
      const minutes = String(value.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      'hour' in value &&
      'minute' in value
    ) {
      const timeValue = value as { hour?: number; minute?: number };
      if (
        typeof timeValue.hour === 'number' &&
        typeof timeValue.minute === 'number'
      ) {
        return `${String(timeValue.hour).padStart(2, '0')}:${String(
          timeValue.minute,
        ).padStart(2, '0')}`;
      }
    }

    return null;
  }
}
