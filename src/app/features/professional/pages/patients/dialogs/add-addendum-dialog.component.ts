/**
 * Add Addendum Dialog Component
 *
 * Dialog for adding an addendum to a closed encounter
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
import { ProfessionalPatientsService } from '../../../services/professional-patients.service';

export interface AddAddendumDialogData {
  encounterId: string;
}

@Component({
  selector: 'app-add-addendum-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './add-addendum-dialog.component.html',
  styleUrl: './add-addendum-dialog.component.scss',
})
export class AddAddendumDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AddAddendumDialogComponent>);
  private readonly data = inject<AddAddendumDialogData>(MAT_DIALOG_DATA);
  private readonly patientsService = inject(ProfessionalPatientsService);
  private readonly fb = inject(FormBuilder);

  // State
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);

  // Form
  readonly form = this.fb.group({
    text: ['', [Validators.required, Validators.minLength(10)]],
    title: [''],
  });

  /**
   * Submit form
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    const formValue = this.form.getRawValue();

    this.patientsService
      .addAddendum(this.data.encounterId, {
        text: formValue.text!,
        title: formValue.title || undefined,
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (encounter) => {
          this.dialogRef.close(encounter);
        },
        error: (error) => {
          this.error.set(error.message || 'Error al agregar addendum');
        },
      });
  }

  /**
   * Cancel
   */
  cancel(): void {
    this.dialogRef.close();
  }
}
