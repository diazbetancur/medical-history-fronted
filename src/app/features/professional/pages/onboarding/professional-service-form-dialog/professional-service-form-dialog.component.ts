import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface ProfessionalServiceFormDialogData {
  title: string;
  submitLabel: string;
  initial?: {
    name: string;
    description: string;
  };
}

export interface ProfessionalServiceFormDialogResult {
  name: string;
  description?: string;
}

@Component({
  selector: 'app-professional-service-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './professional-service-form-dialog.component.html',
  styleUrl: './professional-service-form-dialog.component.scss',
})
export class ProfessionalServiceFormDialogComponent {
  readonly data = inject<ProfessionalServiceFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<ProfessionalServiceFormDialogComponent>,
  );
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    name: [
      this.data.initial?.name ?? '',
      [Validators.required, Validators.maxLength(150)],
    ],
    description: [
      this.data.initial?.description ?? '',
      [Validators.maxLength(1000)],
    ],
  });

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.dialogRef.close({
      name: value.name.trim(),
      description: value.description.trim() || undefined,
    } satisfies ProfessionalServiceFormDialogResult);
  }
}
