import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProfessionalAppointmentsApi } from '@data/api/professional-appointments.api';
import type { AppointmentDto } from '@data/models/appointment.models';

/** Data injected into this dialog */
export interface AddExternalAppointmentDialogData {
  /** Professional profile ID (from the authenticated user's session) */
  professionalProfileId: string;
}

/** External source options shown in the select */
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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
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

  protected readonly form: FormGroup;

  /** Today's date in YYYY-MM-DD for the min attribute on the date input */
  protected readonly todayStr = new Date().toISOString().split('T')[0];

  constructor() {
    this.form = this.fb.group({
      patientName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(200),
        ],
      ],
      patientEmail: ['', [Validators.email, Validators.maxLength(255)]],
      patientPhone: ['', Validators.maxLength(30)],
      appointmentDate: ['', Validators.required],
      timeSlot: [
        '',
        [
          Validators.required,
          Validators.pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
        ],
      ],
      durationMinutes: [30, [Validators.min(15), Validators.max(480)]],
      externalSource: [null, Validators.required],
      reason: ['', Validators.maxLength(500)],
      externalNotes: ['', Validators.maxLength(1000)],
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const v = this.form.value;

    this.api
      .createExternalAppointment({
        professionalProfileId: this.data.professionalProfileId,
        patientName: v.patientName.trim(),
        patientEmail: v.patientEmail?.trim() || undefined,
        patientPhone: v.patientPhone?.trim() || undefined,
        appointmentDate: v.appointmentDate,
        timeSlot: v.timeSlot,
        durationMinutes: v.durationMinutes ?? 30,
        externalSource: v.externalSource,
        reason: v.reason?.trim() || undefined,
        externalNotes: v.externalNotes?.trim() || undefined,
      })
      .subscribe({
        next: (appointment: AppointmentDto) => {
          this.submitting.set(false);
          this.dialogRef.close(appointment);
        },
        error: (err: { error?: { detail?: string; title?: string } }) => {
          this.submitting.set(false);
          this.errorMessage.set(
            err?.error?.detail ??
              err?.error?.title ??
              'Error al crear la cita externa',
          );
        },
      });
  }
}
