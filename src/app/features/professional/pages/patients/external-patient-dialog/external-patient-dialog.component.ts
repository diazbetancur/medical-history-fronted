import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';
import {
  ProfessionalPatientLookupResultDto,
  ProfessionalPatientsService,
} from '../../../services/professional-patients.service';

export interface ExternalPatientDialogResult {
  patientProfileId: string;
  fullName?: string | null;
  created: boolean;
}

@Component({
  selector: 'app-external-patient-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './external-patient-dialog.component.html',
  styleUrl: './external-patient-dialog.component.scss',
})
export class ExternalPatientDialogComponent {
  private readonly patientsService = inject(ProfessionalPatientsService);
  private readonly dialogRef = inject(
    MatDialogRef<ExternalPatientDialogComponent, ExternalPatientDialogResult | null>,
  );
  private readonly fb = inject(FormBuilder);

  readonly documentTypeOptions = ['DNI', 'Pasaporte', 'RNP'];
  readonly isLookingUp = signal(false);
  readonly isCreatingExternal = signal(false);
  readonly lookupResult = signal<ProfessionalPatientLookupResultDto | null>(
    null,
  );
  readonly lookupError = signal<string | null>(null);

  readonly lookupForm = this.fb.nonNullable.group({
    documentType: ['DNI', [Validators.required, Validators.maxLength(10)]],
    documentNumber: ['', [Validators.required, Validators.maxLength(30)]],
  });

  readonly externalForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(200)]],
    documentType: ['DNI', [Validators.required, Validators.maxLength(10)]],
    documentNumber: ['', [Validators.required, Validators.maxLength(30)]],
    phone: ['', [Validators.maxLength(20)]],
    email: ['', [Validators.email, Validators.maxLength(255)]],
  });

  constructor() {
    this.lookupForm.valueChanges.subscribe(() => {
      this.lookupResult.set(null);
      this.lookupError.set(null);
    });
  }

  lookupPatient(): void {
    if (this.lookupForm.invalid) {
      this.lookupForm.markAllAsTouched();
      return;
    }

    const raw = this.lookupForm.getRawValue();
    this.isLookingUp.set(true);
    this.lookupError.set(null);
    this.lookupResult.set(null);

    this.patientsService
      .lookupByDocument({
        documentType: raw.documentType.trim(),
        documentNumber: raw.documentNumber.trim(),
      })
      .pipe(finalize(() => this.isLookingUp.set(false)))
      .subscribe({
        next: (result) => {
          this.lookupResult.set(result);
          if (!result.exists) {
            this.externalForm.patchValue({
              documentType: raw.documentType,
              documentNumber: raw.documentNumber,
            });
          }
        },
        error: (error) => {
          this.lookupError.set(error.message || 'No se pudo buscar paciente');
        },
      });
  }

  createExternalPatient(): void {
    if (this.externalForm.invalid) {
      this.externalForm.markAllAsTouched();
      return;
    }

    const raw = this.externalForm.getRawValue();
    this.isCreatingExternal.set(true);
    this.lookupError.set(null);

    this.patientsService
      .createExternalPatientProfile({
        fullName: raw.fullName.trim(),
        documentType: raw.documentType.trim(),
        documentNumber: raw.documentNumber.trim(),
        phone: this.normalizeOptionalText(raw.phone),
        email: this.normalizeOptionalText(raw.email),
      })
      .pipe(finalize(() => this.isCreatingExternal.set(false)))
      .subscribe({
        next: (created) => {
          this.dialogRef.close({
            patientProfileId: created.patientProfileId,
            fullName: created.fullName,
            created: true,
          });
        },
        error: (error) => {
          this.lookupError.set(
            error.message || 'No se pudo crear el paciente externo',
          );
        },
      });
  }

  useFoundPatient(result: ProfessionalPatientLookupResultDto): void {
    if (!result.patientProfileId) {
      return;
    }

    this.dialogRef.close({
      patientProfileId: result.patientProfileId,
      fullName: result.fullName,
      created: false,
    });
  }

  private normalizeOptionalText(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
