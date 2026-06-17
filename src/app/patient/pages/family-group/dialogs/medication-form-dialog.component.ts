import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MedicationInput } from '../../../services/family-group.models';

@Component({
  selector: 'app-medication-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
  ],
  templateUrl: './medication-form-dialog.component.html',
})
export class MedicationFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef =
    inject(MatDialogRef<MedicationFormDialogComponent>);
  private readonly data = inject<MedicationInput | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  readonly isEdit = !!this.data;

  readonly form = this.fb.nonNullable.group({
    name: [this.data?.name ?? '', [Validators.required, Validators.maxLength(200)]],
    dose: [this.data?.dose ?? '', [Validators.maxLength(120)]],
    frequency: [this.data?.frequency ?? '', [Validators.maxLength(120)]],
    prescribedBy: [this.data?.prescribedBy ?? '', [Validators.maxLength(200)]],
    startDate: [this.data?.startDate ?? ''],
    endDate: [this.data?.endDate ?? ''],
    isOngoing: [this.data?.isOngoing ?? false],
    notes: [this.data?.notes ?? '', [Validators.maxLength(1000)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: MedicationInput = {
      name: v.name.trim(),
      dose: v.dose.trim() || undefined,
      frequency: v.frequency.trim() || undefined,
      prescribedBy: v.prescribedBy.trim() || undefined,
      startDate: v.startDate || undefined,
      endDate: v.endDate || undefined,
      isOngoing: v.isOngoing,
      notes: v.notes.trim() || undefined,
    };
    this.dialogRef.close(payload);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
