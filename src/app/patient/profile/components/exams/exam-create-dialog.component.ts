import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
  CreateExamRequest,
  EXAM_CATEGORY_LABELS,
  ExamCategory,
} from '../../../models/patient-exam.dto';
import { PatientExamsStore } from '../../../stores/patient-exams.store';

/**
 * Exam Create Dialog Component
 *
 * Dialog para crear un nuevo examen médico
 */
@Component({
  selector: 'app-exam-create-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './exam-create-dialog.component.html',
  styleUrl: './exam-create-dialog.component.scss',
})
export class ExamCreateDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ExamCreateDialogComponent>);
  private readonly store = inject(PatientExamsStore);

  readonly categoryLabels = EXAM_CATEGORY_LABELS;
  readonly categories = Object.keys(EXAM_CATEGORY_LABELS) as ExamCategory[];

  readonly creating = false;
  selectedFile: File | null = null;

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    category: [''],
    examDate: [''],
    notes: ['', [Validators.maxLength(1000)]],
  });

  /**
   * Cancel and close dialog
   */
  cancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * Create exam
   */
  async create(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.selectedFile) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;

    const request: CreateExamRequest = {
      title: formValue.title!,
      category: (formValue.category || undefined) as ExamCategory | undefined,
      examDate: this.normalizeDateOnly(formValue.examDate) || undefined,
      notes: formValue.notes || undefined,
    };

    const exam = await this.store.createExam(request, this.selectedFile);

    if (exam) {
      this.dialogRef.close(true);
    }
  }

  /**
   * Get error message for a field
   */
  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control) return '';

    if (control.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control.hasError('maxlength')) {
      const maxLength = control.getError('maxlength').requiredLength;
      return `Máximo ${maxLength} caracteres`;
    }
    return '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.selectedFile = null;
      return;
    }

    this.selectedFile = input.files[0];
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
