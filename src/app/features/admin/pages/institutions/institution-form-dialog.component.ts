import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type {
  CreateInstitutionDto,
  InstitutionDto,
  UpdateInstitutionDto,
} from '@data/models/institution.models';

export interface InstitutionFormDialogData {
  mode: 'create' | 'edit';
  institution?: InstitutionDto;
}

/**
 * Institution Form Dialog Component
 *
 * Modal para crear o editar una institución.
 */
@Component({
  selector: 'app-institution-form-dialog',
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
      {{ isEditMode ? 'Editar' : 'Nueva' }} Institución
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="institution-form">
        <!-- Name -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre *</mat-label>
          <input
            matInput
            formControlName="name"
            placeholder="Ej: Hospital General"
          />
          @if (
            form.get('name')?.hasError('required') && form.get('name')?.touched
          ) {
            <mat-error>El nombre es requerido</mat-error>
          }
        </mat-form-field>

        <!-- Code -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Código *</mat-label>
          <input matInput formControlName="code" placeholder="Ej: HG-001" />
          <mat-hint>Código único de la institución</mat-hint>
          @if (
            form.get('code')?.hasError('required') && form.get('code')?.touched
          ) {
            <mat-error>El código es requerido</mat-error>
          }
        </mat-form-field>

        <!-- Description -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción</mat-label>
          <textarea
            matInput
            formControlName="description"
            rows="3"
            placeholder="Descripción breve de la institución"
          ></textarea>
        </mat-form-field>

        <div class="form-row">
          <!-- Phone -->
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Teléfono</mat-label>
            <input
              matInput
              formControlName="phone"
              placeholder="Ej: +1234567890"
            />
          </mat-form-field>

          <!-- Email -->
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Email</mat-label>
            <input
              matInput
              type="email"
              formControlName="email"
              placeholder="Ej: contacto@hospital.com"
            />
            @if (
              form.get('email')?.hasError('email') && form.get('email')?.touched
            ) {
              <mat-error>Email inválido</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Address -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Dirección</mat-label>
          <input
            matInput
            formControlName="address"
            placeholder="Ej: Av. Principal 123, Ciudad"
          />
        </mat-form-field>

        <!-- Website -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Sitio Web</mat-label>
          <input
            matInput
            formControlName="website"
            placeholder="Ej: https://www.hospital.com"
          />
        </mat-form-field>

        <!-- Is Active -->
        <div class="toggle-container">
          <mat-slide-toggle formControlName="isActive" color="primary">
            Institución Activa
          </mat-slide-toggle>
          <p class="toggle-hint">
            Las instituciones inactivas no aparecerán en los listados públicos
          </p>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="form.invalid"
        (click)="onSubmit()"
      >
        <mat-icon>{{ isEditMode ? 'save' : 'add' }}</mat-icon>
        {{ isEditMode ? 'Guardar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      h2[mat-dialog-title] {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 0;
        padding: 24px 24px 16px;

        mat-icon {
          color: var(--primary-color, var(--color-primary));
        }
      }

      mat-dialog-content {
        padding: 0 24px 24px;
        min-height: 200px;
      }

      .institution-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-top: 8px;
      }

      .full-width {
        width: 100%;
      }

      .form-row {
        display: flex;
        gap: 16px;

        .half-width {
          flex: 1;
        }
      }

      .toggle-container {
        padding: 16px 0 8px;

        mat-slide-toggle {
          display: block;
          margin-bottom: 8px;
        }

        .toggle-hint {
          margin: 0;
          font-size: 12px;
          color: var(--color-text-secondary);
          padding-left: 4px;
        }
      }

      mat-dialog-actions {
        padding: 16px 24px;
        gap: 8px;

        button mat-icon {
          margin-right: 8px;
        }
      }

      @media (max-width: 600px) {
        .form-row {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class InstitutionFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(
    MatDialogRef<InstitutionFormDialogComponent>,
  );
  readonly data = inject<InstitutionFormDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Initialize form with validators
   */
  private initForm(): void {
    this.form = this.fb.group({
      name: [
        this.data.institution?.name || '',
        [Validators.required, Validators.minLength(3)],
      ],
      code: [
        this.data.institution?.code || '',
        [Validators.required, Validators.minLength(2)],
      ],
      description: [this.data.institution?.description || ''],
      address: [this.data.institution?.address || ''],
      phone: [this.data.institution?.phone || ''],
      email: [this.data.institution?.email || '', [Validators.email]],
      website: [this.data.institution?.website || ''],
      isActive: [this.data.institution?.isActive ?? true],
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;

    // Clean empty strings to undefined
    const dto: CreateInstitutionDto | UpdateInstitutionDto = {
      name: formValue.name,
      code: formValue.code,
      description: formValue.description || undefined,
      address: formValue.address || undefined,
      phone: formValue.phone || undefined,
      email: formValue.email || undefined,
      website: formValue.website || undefined,
      isActive: formValue.isActive,
    };

    this.dialogRef.close(dto);
  }
}
