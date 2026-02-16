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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
  CreateMedicationDto,
  MedicationDto,
  UpdateMedicationDto,
} from '@data/models';

export interface MedicationDialogData {
  mode: 'create' | 'edit';
  medication?: MedicationDto;
}

@Component({
  selector: 'app-medication-dialog',
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
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatNativeDateModule,
  ],
  templateUrl: './medication-dialog.component.html',
  styleUrl: './medication-dialog.component.scss',
})
export class MedicationDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<MedicationDialogComponent>);
  private fb = inject(FormBuilder);
  public data = inject<MedicationDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;
  isSubmitting = signal(false);

  readonly statusOptions = [
    { value: 'Active' as const, label: 'Activo' },
    { value: 'Stopped' as const, label: 'Suspendido' },
  ];

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Editar Medicamento' : 'Agregar Medicamento';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Guardar Cambios' : 'Agregar';
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const medication = this.data.medication;

    this.form = this.fb.group({
      name: [medication?.name || '', [Validators.required]],
      dose: [medication?.dose || ''],
      frequency: [medication?.frequency || ''],
      route: [medication?.route || ''],
      prescribedBy: [medication?.prescribedBy || ''],
      startDate: [
        medication?.startDate ? new Date(medication.startDate) : new Date(),
        [Validators.required],
      ],
      isOngoing: [medication?.isOngoing ?? true],
      endDate: [medication?.endDate ? new Date(medication.endDate) : null, []],
      notes: [medication?.notes || ''],
      status: [medication?.status || 'Active', [Validators.required]],
    });

    // Update endDate validation and disabled state based on isOngoing
    this.form.get('isOngoing')?.valueChanges.subscribe((isOngoing) => {
      const endDateControl = this.form.get('endDate');
      if (isOngoing) {
        endDateControl?.clearValidators();
        endDateControl?.setValue(null);
        endDateControl?.disable();
      } else {
        endDateControl?.setValidators([Validators.required]);
        endDateControl?.enable();
      }
      endDateControl?.updateValueAndValidity();
    });

    // If Status=Stopped, force IsOngoing=false
    this.form.get('status')?.valueChanges.subscribe((status) => {
      if (status === 'Stopped') {
        this.form.get('isOngoing')?.setValue(false);
      }
    });

    // Initialize endDate state
    const isOngoing = this.form.get('isOngoing')?.value;
    if (isOngoing) {
      this.form.get('endDate')?.disable();
    }
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

    const dto: CreateMedicationDto | UpdateMedicationDto = {
      name: formValue.name,
      dose: formValue.dose || undefined,
      frequency: formValue.frequency || undefined,
      route: formValue.route || undefined,
      prescribedBy: formValue.prescribedBy || undefined,
      startDate: formValue.startDate.toISOString(),
      isOngoing: formValue.isOngoing,
      endDate: formValue.endDate ? formValue.endDate.toISOString() : undefined,
      notes: formValue.notes || undefined,
      status: formValue.status,
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

    return '';
  }
}
