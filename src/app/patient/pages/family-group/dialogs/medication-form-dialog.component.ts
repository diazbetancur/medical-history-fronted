import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormLabelComponent } from '@shared/ui/forms';
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
    FormLabelComponent,
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

  readonly form = this.fb.nonNullable.group(
    {
      name: [this.data?.name ?? '', [Validators.required, Validators.maxLength(200)]],
      dose: [this.data?.dose ?? '', [Validators.maxLength(120)]],
      frequency: [this.data?.frequency ?? '', [Validators.maxLength(120)]],
      prescribedBy: [this.data?.prescribedBy ?? '', [Validators.maxLength(200)]],
      startDate: [this.data?.startDate ?? ''],
      endDate: [this.data?.endDate ?? ''],
      isOngoing: [this.data?.isOngoing ?? false],
      notes: [this.data?.notes ?? '', [Validators.maxLength(1000)]],
    },
    { validators: [medicationConsistencyValidator] },
  );

  constructor() {
    // "En curso" and "Fecha de fin" are mutually exclusive (backend rejects the
    // combo). Keep the end date cleared/disabled while ongoing so the invalid
    // state can't be submitted — and the user finds out before saving, not after.
    const endDate = this.form.controls.endDate;
    this.form.controls.isOngoing.valueChanges.subscribe((isOngoing) => {
      if (isOngoing) {
        endDate.setValue('');
        endDate.disable();
      } else {
        endDate.enable();
      }
    });
    if (this.form.controls.isOngoing.value) {
      endDate.setValue('');
      endDate.disable();
    }
  }

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

/**
 * Cross-field rules for a medication:
 * - An ongoing medication ("En curso") cannot have an end date.
 * - The end date must be on or after the start date.
 */
function medicationConsistencyValidator(
  group: AbstractControl,
): ValidationErrors | null {
  const isOngoing = group.get('isOngoing')?.value;
  const startDate = group.get('startDate')?.value;
  const endDate = group.get('endDate')?.value;

  if (isOngoing && endDate) {
    return { ongoingWithEndDate: true };
  }

  if (!isOngoing && startDate && endDate && endDate < startDate) {
    return { invalidDateRange: true };
  }

  return null;
}
