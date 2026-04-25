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
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ isEditMode ? 'edit' : 'add' }}</mat-icon>
      {{ isEditMode ? 'Editar' : 'Nueva' }} Especialidad
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Nombre *</mat-label>
          <input
            matInput
            formControlName="name"
            placeholder="Ej: Cardiología"
          />
          @if (form.get('name')?.invalid && form.get('name')?.touched) {
            <mat-error>El nombre es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <div class="toggle-row">
          <mat-slide-toggle color="primary" formControlName="isActive">
            Activa
          </mat-slide-toggle>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-raised-button
        color="primary"
        (click)="submit()"
        [disabled]="form.invalid"
      >
        {{ isEditMode ? 'Guardar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      h2[mat-dialog-title] {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .form {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 420px;
      }

      .full {
        width: 100%;
      }

      .toggle-row {
        padding-top: 6px;
      }

      @media (max-width: 640px) {
        .form {
          min-width: auto;
        }
      }
    `,
  ],
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
