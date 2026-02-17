/**
 * Exam Upload Dialog Component
 *
 * Dialog for uploading a new exam with file
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
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CreateExamDto } from '@data/models';
import { PatientExamsMvpService } from '@patient/services/patient-exams-mvp.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Component({
  selector: 'app-exam-upload-dialog',
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
  templateUrl: './exam-upload-dialog.component.html',
  styleUrl: './exam-upload-dialog.component.scss',
})
export class ExamUploadDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ExamUploadDialogComponent>);
  private readonly fb = inject(FormBuilder);
  private readonly examsService = inject(PatientExamsMvpService);

  form!: FormGroup;
  isSubmitting = signal(false);
  selectedFile = signal<File | null>(null);
  fileError = signal<string | null>(null);
  previewUrl = signal<string | null>(null);

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      examDate: [new Date().toISOString().split('T')[0], [Validators.required]],
      notes: ['', [Validators.maxLength(1000)]],
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    this.fileError.set(null);

    // Validate file type
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];
    if (!validTypes.includes(file.type)) {
      this.fileError.set(
        'Tipo de archivo no válido. Solo se permiten PDF e imágenes (JPG, PNG).',
      );
      this.selectedFile.set(null);
      this.previewUrl.set(null);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      this.fileError.set(
        'El archivo es demasiado grande. Tamaño máximo: 10MB.',
      );
      this.selectedFile.set(null);
      this.previewUrl.set(null);
      return;
    }

    this.selectedFile.set(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      this.previewUrl.set(null);
    }
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.fileError.set(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.selectedFile()) {
      this.fileError.set('Debes seleccionar un archivo');
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.form.value;
    const dto: CreateExamDto = {
      title: formValue.title,
      examDate: this.normalizeDateOnly(formValue.examDate)!,
      notes: formValue.notes || undefined,
    };

    this.examsService.create(dto, this.selectedFile()!).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.isSubmitting.set(false);
        this.fileError.set(error.message || 'Error al subir examen');
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
