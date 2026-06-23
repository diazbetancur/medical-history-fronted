import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
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
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './medication-dialog.component.html',
  styleUrl: './medication-dialog.component.scss',
})
export class MedicationDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<MedicationDialogComponent>);
  private readonly fb = inject(FormBuilder);
  public data = inject<MedicationDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;
  isSubmitting = signal(false);
  readonly maxStartDate = this.getTodayDate();

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

    this.form = this.fb.group(
      {
        name: [
          medication?.name || '',
          [Validators.required, Validators.maxLength(200)],
        ],
        dose: [medication?.dose || '', [Validators.maxLength(100)]],
        frequency: [medication?.frequency || '', [Validators.maxLength(100)]],
        route: [medication?.route || '', [Validators.maxLength(100)]],
        prescribedBy: [
          medication?.prescribedBy || '',
          [Validators.maxLength(200)],
        ],
        startDate: [this.toDateValue(medication?.startDate)],
        isOngoing: [medication?.isOngoing ?? true],
        endDate: [this.toDateValue(medication?.endDate), []],
        notes: [medication?.notes || '', [Validators.maxLength(500)]],
        status: [medication?.status || 'Active', [Validators.required]],
      },
      {
        validators: [this.medicationDateRangeValidator()],
      },
    );

    // Update endDate validation and disabled state based on isOngoing
    this.form.get('isOngoing')?.valueChanges.subscribe((isOngoing) => {
      const endDateControl = this.form.get('endDate');
      if (isOngoing) {
        // An ongoing medication cannot be "Suspendido" — keep status consistent.
        if (this.form.get('status')?.value === 'Stopped') {
          this.form.get('status')?.setValue('Active');
        }
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
      name: formValue.name?.trim(),
      dose: formValue.dose?.trim() || undefined,
      frequency: formValue.frequency?.trim() || undefined,
      route: formValue.route?.trim() || undefined,
      prescribedBy: formValue.prescribedBy?.trim() || undefined,
      startDate: this.normalizeDateOnly(formValue.startDate) || undefined,
      isOngoing: formValue.isOngoing,
      endDate: this.normalizeDateOnly(formValue.endDate) || undefined,
      notes: formValue.notes?.trim() || undefined,
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

    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }

    if (control.errors['matDatepickerParse']) {
      return 'Ingresa una fecha válida';
    }

    if (control.errors['matDatepickerMax']) {
      return 'La fecha de inicio no puede ser posterior a hoy';
    }

    if (
      fieldName === 'endDate' &&
      this.form.hasError('invalidDateRange') &&
      (control.touched || control.dirty)
    ) {
      return 'La fecha de fin debe ser igual o posterior a la fecha de inicio';
    }

    return '';
  }

  private medicationDateRangeValidator() {
    return (group: AbstractControl): ValidationErrors | null => {
      const startDate = this.normalizeDateOnly(group.get('startDate')?.value);
      const endDate = this.normalizeDateOnly(group.get('endDate')?.value);
      const isOngoing = group.get('isOngoing')?.value;

      if (!startDate || !endDate || isOngoing) {
        return null;
      }

      return endDate >= startDate ? null : { invalidDateRange: true };
    };
  }

  private normalizeDateOnly(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === 'string') {
      return value.length >= 10 ? value.slice(0, 10) : null;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      // Local date parts (no toISOString) to avoid the UTC off-by-one shift.
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

  /** Parse a stored YYYY-MM-DD string into a local Date for the datepicker control. */
  private toDateValue(value: unknown): Date | null {
    const dateOnly = this.normalizeDateOnly(value);
    if (!dateOnly) return null;
    const [year, month, day] = dateOnly.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }
}
