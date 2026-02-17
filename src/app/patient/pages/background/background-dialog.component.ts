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
  templateUrl: './background-dialog.component.html',
  styleUrl: './background-dialog.component.scss',
})
export class BackgroundDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<BackgroundDialogComponent>);
  private fb = inject(FormBuilder);
  public data = inject<BackgroundDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;
  isSubmitting = signal(false);

  readonly typeOptions = [
    { value: 'Surgery' as BackgroundType, label: 'Cirugía' },
    { value: 'ChronicDisease' as BackgroundType, label: 'Enfermedad Crónica' },
    { value: 'Trauma' as BackgroundType, label: 'Trauma' },
    { value: 'FamilyHistory' as BackgroundType, label: 'Antecedente Familiar' },
    { value: 'Hospitalization' as BackgroundType, label: 'Hospitalización' },
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

    this.form = this.fb.group({
      type: [background?.type || null, [Validators.required]],
      title: [
        background?.title || '',
        [Validators.required, Validators.maxLength(200)],
      ],
      description: [
        background?.description || '',
        [Validators.maxLength(1000)],
      ],
      eventDate: [
        background?.eventDate ? new Date(background.eventDate) : null,
      ],
      isChronic: [background?.isChronic || false],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;

    const dto: CreateBackgroundDto | UpdateBackgroundDto = {
      type: formValue.type,
      title: formValue.title.trim(),
      description: formValue.description?.trim() || null,
      eventDate: formValue.eventDate
        ? formValue.eventDate.toISOString().split('T')[0]
        : null,
      isChronic: formValue.isChronic,
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

    return 'Campo inválido';
  }

  getRemainingChars(field: string, maxLength: number): string {
    const value = this.form.get(field)?.value || '';
    const remaining = maxLength - value.length;
    return `${remaining} caracteres restantes`;
  }
}
