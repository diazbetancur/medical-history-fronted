/**
 * Exam Edit Dialog Component
 *
 * Dialog for editing exam metadata (not file)
 */

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ExamDto, UpdateExamDto } from '@data/models';
import { PatientExamsMvpService } from '@patient/services/patient-exams-mvp.service';

export interface ExamEditDialogData {
  exam: ExamDto;
}

@Component({
  selector: 'app-exam-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './exam-edit-dialog.component.html',
  styleUrl: './exam-edit-dialog.component.scss',
})
export class ExamEditDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ExamEditDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly examsService = inject(PatientExamsMvpService);
  public data = inject<ExamEditDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;
  isSubmitting = signal(false);

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const exam = this.data.exam;

    this.form = this.fb.group({
      title: [exam.title, [Validators.required, Validators.maxLength(200)]],
      examDate: [this.normalizeDateOnly(exam.examDate), [Validators.required]],
      notes: [exam.notes || '', [Validators.maxLength(1000)]],
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

    this.isSubmitting.set(true);

    const formValue = this.form.value;
    const dto: UpdateExamDto = {
      title: formValue.title,
      examDate: this.normalizeDateOnly(formValue.examDate)!,
      notes: formValue.notes || undefined,
    };

    this.examsService.update(this.data.exam.id, dto).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        alert(error.message || 'Error al actualizar examen');
      },
    });
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
      const max = control.errors['maxlength'].requiredLength;
      return `Máximo ${max} caracteres`;
    }

    return '';
  }

  private normalizeDateOnly(value: unknown): string | null {
    if (!value) return null;
    if (typeof value === 'string') {
      return value.length >= 10 ? value.slice(0, 10) : null;
    }
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().split('T')[0];
    }
    return null;
  }
}
