import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
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
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import {
  BackgroundDto,
  BackgroundType,
  CreateBackgroundDto,
  UpdateBackgroundDto,
} from '@data/models';

export interface BackgroundDialogData {
  mode: 'create' | 'edit';
  background?: BackgroundDto;
}

@Component({
  selector: 'app-background-dialog',
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
  templateUrl: './background-dialog.component.html',
  styleUrl: './background-dialog.component.scss',
})
export class BackgroundDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<BackgroundDialogComponent>);
  private readonly fb = inject(FormBuilder);
  public data = inject<BackgroundDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;
  isSubmitting = signal(false);
  readonly maxEventDate = this.getTodayDate();

  readonly typeOptions = [
    { value: 'Chronic' as BackgroundType, label: 'Crónico' },
    { value: 'Surgical' as BackgroundType, label: 'Quirúrgico' },
    { value: 'Traumatic' as BackgroundType, label: 'Traumático' },
    { value: 'Allergic' as BackgroundType, label: 'Alérgico' },
    { value: 'Hereditary' as BackgroundType, label: 'Hereditario' },
    { value: 'Perinatal' as BackgroundType, label: 'Perinatal' },
    { value: 'Pharmacological' as BackgroundType, label: 'Farmacológico' },
    { value: 'Other' as BackgroundType, label: 'Otro' },
  ];

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Editar Antecedente' : 'Agregar Antecedente';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Guardar Cambios' : 'Agregar';
  }

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const background = this.data.background;
    const isChronicType = background?.type === 'Chronic';

    this.form = this.fb.group({
      type: [background?.type || null, [Validators.required]],
      title: [
        background?.title || '',
        [Validators.required, Validators.maxLength(120)],
      ],
      description: [
        background?.description || '',
        [Validators.maxLength(1000)],
      ],
      eventDate: [
        this.toDateValue(background?.eventDate),
        [this.maxDateValidator()],
      ],
      isChronic: [
        {
          value: isChronicType ? true : (background?.isChronic ?? false),
          disabled: isChronicType,
        },
      ],
    });

    // "Crónico" type implies a chronic condition: force the flag on and lock the
    // toggle so it registers as chronic just from the type. Other types keep it
    // editable; switching away from "Crónico" clears the auto-forced flag.
    this.form.get('type')?.valueChanges.subscribe((type) => {
      const isChronicControl = this.form.get('isChronic');
      if (!isChronicControl) return;
      if (type === 'Chronic') {
        isChronicControl.setValue(true);
        isChronicControl.disable();
      } else if (isChronicControl.disabled) {
        isChronicControl.enable();
        isChronicControl.setValue(false);
      }
    });
  }

  get isChronicTypeSelected(): boolean {
    return this.form?.get('type')?.value === 'Chronic';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // getRawValue (not .value) so the disabled "isChronic" control — locked on when
    // type is "Crónico" — is still included in the payload.
    const formValue = this.form.getRawValue();

    const dto: CreateBackgroundDto | UpdateBackgroundDto = {
      type: formValue.type,
      title: formValue.title.trim(),
      description: formValue.description?.trim() || null,
      eventDate: this.normalizeDateOnly(formValue.eventDate),
      isChronic: formValue.isChronic === true,
    };

    this.dialogRef.close(dto);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control?.errors) return '';

    if (control.errors['required']) {
      return 'Este campo es requerido';
    }
    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    if (control.errors['matDatepickerMax'] || control.errors['futureDate']) {
      return 'La fecha no puede ser posterior al día actual';
    }
    if (control.errors['matDatepickerParse']) {
      return 'Ingresa una fecha válida';
    }

    return 'Campo inválido';
  }

  getRemainingChars(field: string, maxLength: number): string {
    const value = this.form.get(field)?.value || '';
    const remaining = maxLength - value.length;
    return `${remaining} caracteres restantes`;
  }

  private normalizeDateOnly(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === 'string') {
      return value.length >= 10 ? value.slice(0, 10) : null;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return this.formatDateOnly(value);
    }
    return null;
  }

  private toDateValue(value: unknown): Date | null {
    const dateOnly = this.normalizeDateOnly(value);
    if (!dateOnly) return null;

    const [year, month, day] = dateOnly.split('-').map(Number);
    if (!year || !month || !day) return null;

    return new Date(year, month - 1, day);
  }

  private maxDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const date =
        value instanceof Date ? value : this.toDateValue(String(value));

      if (!date || Number.isNaN(date.getTime())) return null;

      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);

      return selectedDate <= this.maxEventDate ? null : { futureDate: true };
    };
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
}
