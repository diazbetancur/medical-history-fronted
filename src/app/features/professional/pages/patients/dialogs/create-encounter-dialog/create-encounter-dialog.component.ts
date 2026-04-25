/**
 * Create Encounter Dialog Component
 *
 * Dialog for creating a new medical encounter (always starts as DRAFT)
 */

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { ProfessionalPatientsService } from '../../../../services/professional-patients.service';

export interface CreateEncounterDialogData {
  patientProfileId: string;
  appointmentId?: string;
}

@Component({
  selector: 'app-create-encounter-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './create-encounter-dialog.component.html',
  styleUrl: './create-encounter-dialog.component.scss',
})
export class CreateEncounterDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<CreateEncounterDialogComponent>,
  );
  readonly data = inject<CreateEncounterDialogData>(MAT_DIALOG_DATA);
  private readonly patientsService = inject(ProfessionalPatientsService);
  private readonly fb = inject(FormBuilder);

  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    summary: ['', [Validators.maxLength(200)]],
    initialNote: ['', [Validators.required, Validators.maxLength(20000)]],
    noteTitle: ['', [Validators.maxLength(100)]],
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    const formValue = this.form.getRawValue();

    this.patientsService
      .createEncounter(this.data.patientProfileId, {
        summary: formValue.summary?.trim() || undefined,
        initialNote: formValue.initialNote?.trim() || '',
        noteTitle: formValue.noteTitle?.trim() || undefined,
        appointmentId: this.data.appointmentId || undefined,
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (encounter) => {
          this.dialogRef.close(encounter);
        },
        error: (error) => {
          this.error.set(error.message || 'Error al crear atencion');
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
