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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type {
  CreateSpecialtyDto,
  SpecialtyDto,
  UpdateSpecialtyDto,
} from '@data/models';

export interface SpecialtyFormDialogData {
  mode: 'create' | 'edit';
  specialty?: SpecialtyDto;
}

@Component({
  selector: 'app-specialty-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  templateUrl: './specialty-form-dialog.component.html',
  styleUrl: './specialty-form-dialog.component.scss',
})
export class SpecialtyFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<SpecialtyFormDialogComponent>,
  );
  readonly data = inject<SpecialtyFormDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = this.data.mode === 'edit';

  readonly form = this.fb.group({
    name: [
      this.data.specialty?.name ?? '',
      [Validators.required, Validators.minLength(2)],
    ],
    description: [this.data.specialty?.description ?? ''],
    isActive: [this.data.specialty?.isActive ?? true],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: CreateSpecialtyDto | UpdateSpecialtyDto = {
      name: value.name?.trim() || '',
      description: value.description?.trim() || undefined,
      isActive: !!value.isActive,
    };

    this.dialogRef.close(payload);
  }
}
