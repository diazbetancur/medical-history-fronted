import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
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
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
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

    const formValue = this.form.value;

    // Format examDate to ISO string if present
    let examDate: string | undefined;
    if (formValue.examDate) {
      try {
        const date = new Date(formValue.examDate);
        examDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } catch {
        examDate = undefined;
      }
    }

    const request: CreateExamRequest = {
      title: formValue.title!,
      category: (formValue.category || undefined) as ExamCategory | undefined,
      examDate: examDate,
      notes: formValue.notes || undefined,
    };

    const exam = await this.store.createExam(request);

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
}
