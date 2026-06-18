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
import { MatSelectModule } from '@angular/material/select';
import { FormLabelComponent } from '@shared/ui/forms';
import { AllergyInput } from '../../../services/family-group.models';

@Component({
  selector: 'app-allergy-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormLabelComponent,
  ],
  templateUrl: './allergy-form-dialog.component.html',
})
export class AllergyFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AllergyFormDialogComponent>);
  private readonly data = inject<AllergyInput | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  readonly isEdit = !!this.data;

  readonly severityOptions = [
    { value: 'Mild', label: 'Leve' },
    { value: 'Moderate', label: 'Moderada' },
    { value: 'Severe', label: 'Severa' },
  ];

  readonly statusOptions = [
    { value: 'Active', label: 'Activa' },
    { value: 'Resolved', label: 'Resuelta' },
  ];

  readonly form = this.fb.nonNullable.group({
    allergen: [
      this.data?.allergen ?? '',
      [Validators.required, Validators.maxLength(200)],
    ],
    reaction: [this.data?.reaction ?? '', [Validators.maxLength(500)]],
    severity: [this.data?.severity ?? 'Mild', [Validators.required]],
    status: [this.data?.status ?? 'Active', [Validators.required]],
    notes: [this.data?.notes ?? '', [Validators.maxLength(1000)]],
    onsetDate: [this.data?.onsetDate ?? ''],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: AllergyInput = {
      allergen: v.allergen.trim(),
      reaction: v.reaction.trim() || undefined,
      severity: v.severity.trim() || undefined,
      status: v.status.trim() || undefined,
      notes: v.notes.trim() || undefined,
      onsetDate: v.onsetDate || undefined,
    };
    this.dialogRef.close(payload);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
