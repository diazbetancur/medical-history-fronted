import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { AllergyDto, CreateAllergyDto, UpdateAllergyDto } from '@data/models';

export interface AllergyDialogData {
  mode: 'create' | 'edit';
  allergy?: AllergyDto;
}

@Component({
  selector: 'app-allergy-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatNativeDateModule,
  ],
  templateUrl: './allergy-dialog.component.html',
  styleUrl: './allergy-dialog.component.scss',
})
export class AllergyDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<AllergyDialogComponent>);
  private fb = inject(FormBuilder);
  public data = inject<AllergyDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;
  isSubmitting = signal(false);

  readonly severityOptions = [
    { value: 'Mild' as const, label: 'Leve' },
    { value: 'Moderate' as const, label: 'Moderada' },
    { value: 'Severe' as const, label: 'Severa' },
  ];

  readonly statusOptions = [
    { value: 'Active' as const, label: 'Activa' },
    { value: 'Resolved' as const, label: 'Resuelta' },
  ];

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Editar Alergia' : 'Agregar Alergia';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Guardar Cambios' : 'Agregar';
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const allergy = this.data.allergy;

    this.form = this.fb.group({
      allergen: [
        allergy?.allergen || '',
        [Validators.required, Validators.maxLength(200)],
      ],
      reaction: [allergy?.reaction || '', [Validators.maxLength(500)]],
      severity: [allergy?.severity || null],
      status: [allergy?.status || 'Active', [Validators.required]],
      onsetDate: [allergy?.onsetDate ? new Date(allergy.onsetDate) : null, []],
      notes: [allergy?.notes || '', [Validators.maxLength(1000)]],
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;

    const dto: CreateAllergyDto | UpdateAllergyDto = {
      allergen: formValue.allergen,
      reaction: formValue.reaction || undefined,
      severity: formValue.severity || undefined,
      status: formValue.status,
      onsetDate: formValue.onsetDate
        ? formValue.onsetDate.toISOString()
        : undefined,
      notes: formValue.notes || undefined,
    };

    this.dialogRef.close(dto);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control?.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return 'Este campo es requerido';
    }
    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }

    return '';
  }
}
