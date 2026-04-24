import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
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
import { FormControlErrorComponent, FormLabelComponent } from '@shared/ui/forms';

export interface InstitutionFormDialogData {
  mode: 'create' | 'edit';
  institution?: InstitutionDto;
}

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
    FormLabelComponent,
    FormControlErrorComponent,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ isEditMode ? 'edit' : 'add_business' }}</mat-icon>
      {{ isEditMode ? 'Editar institucion' : 'Nueva institucion' }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="institution-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>
            <app-form-label text="Nombre" [required]="true"></app-form-label>
          </mat-label>
          <input
            matInput
            formControlName="name"
            placeholder="Ingresa el nombre de la institucion"
          />
          <app-form-control-error
            [control]="form.get('name')"
            [submitted]="submitted()"
          ></app-form-control-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Codigo</mat-label>
          <input
            matInput
            formControlName="code"
            placeholder="Ingresa un codigo unico si aplica"
          />
          <mat-hint>Opcional</mat-hint>
          <app-form-control-error
            [control]="form.get('code')"
            [submitted]="submitted()"
          ></app-form-control-error>
        </mat-form-field>

        <div class="toggle-container">
          <mat-slide-toggle formControlName="isActive" color="primary">
            Mantener activa
          </mat-slide-toggle>
          <p class="toggle-hint">
            Las instituciones inactivas dejan de mostrarse en el catalogo.
          </p>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="onSubmit()">
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
      }

      .institution-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 420px;
        padding-top: 8px;
      }

      .full-width {
        width: 100%;
      }

      .toggle-container {
        padding: 8px 0 0;

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

        button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
      }

      @media (max-width: 640px) {
        .institution-form {
          min-width: auto;
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
  readonly submitted = signal(false);

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [
        this.data.institution?.name ?? '',
        [Validators.required, Validators.maxLength(150)],
      ],
      code: [this.data.institution?.code ?? '', [Validators.maxLength(30)]],
      isActive: [this.data.institution?.isActive ?? true],
    });
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const dto: CreateInstitutionDto | UpdateInstitutionDto = {
      name: formValue.name?.trim() || '',
      code: formValue.code?.trim() || undefined,
      isActive: !!formValue.isActive,
    };

    this.dialogRef.close(dto);
  }
}
