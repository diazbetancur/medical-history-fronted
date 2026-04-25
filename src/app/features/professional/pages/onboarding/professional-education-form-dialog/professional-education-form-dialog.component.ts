import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

const EDUCATION_YEAR_MIN = 1900;
const EDUCATION_YEAR_MAX = 2100;

export interface ProfessionalEducationFormDialogData {
  title: string;
  submitLabel: string;
  educationTypeOptions: Array<{ value: number; label: string }>;
  initial?: {
    type: number;
    degreeTitle: string;
    institutionName: string;
    institutionCountry: string;
    startYear: number | null;
    graduationYear: number | null;
    description: string;
  };
}

export interface ProfessionalEducationFormDialogResult {
  type: number;
  degreeTitle: string;
  institutionName: string;
  institutionCountry?: string;
  startYear?: number;
  graduationYear?: number;
  description?: string;
}

@Component({
  selector: 'app-professional-education-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './professional-education-form-dialog.component.html',
  styleUrl: './professional-education-form-dialog.component.scss',
})
export class ProfessionalEducationFormDialogComponent {
  readonly data = inject<ProfessionalEducationFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<ProfessionalEducationFormDialogComponent>,
  );
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group(
    {
      type: [this.data.initial?.type ?? 3, [Validators.required]],
      degreeTitle: [
        this.data.initial?.degreeTitle ?? '',
        [Validators.required, Validators.maxLength(200)],
      ],
      institutionName: [
        this.data.initial?.institutionName ?? '',
        [Validators.required, Validators.maxLength(200)],
      ],
      institutionCountry: [
        this.data.initial?.institutionCountry ?? '',
        [Validators.maxLength(100)],
      ],
      startYear: [
        this.data.initial?.startYear ?? null,
        [
          Validators.min(EDUCATION_YEAR_MIN),
          Validators.max(EDUCATION_YEAR_MAX),
        ],
      ],
      graduationYear: [
        this.data.initial?.graduationYear ?? null,
        [
          Validators.min(EDUCATION_YEAR_MIN),
          Validators.max(EDUCATION_YEAR_MAX),
        ],
      ],
      description: [
        this.data.initial?.description ?? '',
        [Validators.maxLength(1000)],
      ],
    },
    {
      validators: [this.educationYearOrderValidator()],
    },
  );

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
      type: Number(value.type),
      degreeTitle: value.degreeTitle?.trim() ?? '',
      institutionName: value.institutionName?.trim() ?? '',
      institutionCountry: value.institutionCountry?.trim() || undefined,
      startYear: value.startYear ?? undefined,
      graduationYear: value.graduationYear ?? undefined,
      description: value.description?.trim() || undefined,
    } satisfies ProfessionalEducationFormDialogResult);
  }

  private educationYearOrderValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const startYear = Number(control.get('startYear')?.value ?? 0);
      const graduationYear = Number(control.get('graduationYear')?.value ?? 0);

      if (!startYear || !graduationYear) {
        return null;
      }

      return graduationYear >= startYear
        ? null
        : { graduationBeforeStart: true };
    };
  }
}
