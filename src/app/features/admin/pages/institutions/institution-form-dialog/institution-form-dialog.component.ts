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
import {
  FormControlErrorComponent,
  FormLabelComponent,
} from '@shared/ui/forms';

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
  templateUrl: './institution-form-dialog.component.html',
  styleUrl: './institution-form-dialog.component.scss',
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
