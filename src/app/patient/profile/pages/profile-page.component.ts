import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { PatientProfileDto } from '@patient/models/patient-profile.dto';
import { PatientAllergiesPage } from '@patient/pages/allergies/patient-allergies.page';
import { PatientBackgroundPage } from '@patient/pages/background/patient-background.page';
import { PatientMedicationsPage } from '@patient/pages/medications/patient-medications.page';
import { PatientService } from '@patient/services/patient.service';
import { ExamsListComponent } from '../components/exams/exams-list.component';
import { PatientHistoryListComponent } from '../components/history/patient-history-list.component';
import { PrivacySettingsComponent } from '../components/privacy/privacy-settings.component';

/**
 * Profile Page Component
 *
 * Página de perfil del paciente con tabs para diferentes secciones
 */
@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    PatientMedicationsPage,
    PatientAllergiesPage,
    PatientBackgroundPage,
    ExamsListComponent,
    PatientHistoryListComponent,
    PrivacySettingsComponent,
  ],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent implements OnInit {
  private readonly patientService = inject(PatientService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly isLoadingSummary = signal(true);
  readonly isSavingSummary = signal(false);
  readonly isEditingSummary = signal(false);
  readonly summaryError = signal<string | null>(null);
  readonly profile = signal<PatientProfileDto | null>(null);

  readonly summaryForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    dateOfBirth: ['', [Validators.required]],
    street: ['', [Validators.required]],
    city: ['', [Validators.required]],
    country: ['', [Validators.required]],
  });

  readonly fullName = computed(() => {
    const profile = this.profile();
    if (!profile) return 'No disponible';
    return `${profile.firstName} ${profile.lastName}`.trim();
  });

  readonly completeAddress = computed(() => {
    const address = this.profile()?.address;
    if (!address) return 'No disponible';
    const parts = [address.street, address.city, address.state, address.country]
      .filter(Boolean)
      .join(', ');
    return parts || 'No disponible';
  });

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.isLoadingSummary.set(true);
    this.summaryError.set(null);

    this.patientService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.patchSummaryForm(profile);
        this.isLoadingSummary.set(false);
      },
      error: (error) => {
        this.summaryError.set(
          error?.message || 'No se pudo cargar el resumen del perfil',
        );
        this.isLoadingSummary.set(false);
      },
    });
  }

  startEditSummary(): void {
    this.isEditingSummary.set(true);

    this.patientService.getMyProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.patchSummaryForm(profile);
      },
      error: () => {
        const current = this.profile();
        if (current) {
          this.patchSummaryForm(current);
        }
      },
    });
  }

  cancelEditSummary(): void {
    const current = this.profile();
    if (current) {
      this.patchSummaryForm(current);
    }
    this.isEditingSummary.set(false);
  }

  saveSummary(): void {
    if (this.summaryForm.invalid) {
      this.summaryForm.markAllAsTouched();
      return;
    }

    const raw = this.summaryForm.getRawValue();
    this.isSavingSummary.set(true);

    const current = this.profile();
    const request$ = current
      ? this.patientService.updateProfile({
          firstName: raw.firstName,
          lastName: raw.lastName,
          phone: raw.phone,
          dateOfBirth: raw.dateOfBirth,
          address: {
            ...(current.address ?? {
              street: '',
              city: '',
              country: '',
            }),
            street: raw.street,
            city: raw.city,
            country: raw.country,
          },
        })
      : this.patientService.createProfile({
          firstName: raw.firstName,
          lastName: raw.lastName,
          phone: raw.phone,
          dateOfBirth: raw.dateOfBirth,
          hasInsurance: false,
          address: {
            street: raw.street,
            city: raw.city,
            country: raw.country,
          },
        });

    request$.subscribe({
      next: (updatedProfile) => {
        this.profile.set(updatedProfile);
        this.patchSummaryForm(updatedProfile);
        this.isSavingSummary.set(false);
        this.isEditingSummary.set(false);
        this.snackBar.open('Perfil actualizado correctamente', 'OK', {
          duration: 2500,
        });
      },
      error: (error) => {
        this.isSavingSummary.set(false);
        this.snackBar.open(
          error?.message || 'No se pudo actualizar el perfil',
          'Cerrar',
          { duration: 4000 },
        );
      },
    });
  }

  private patchSummaryForm(profile: PatientProfileDto): void {
    this.summaryForm.patchValue({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
      dateOfBirth: this.normalizeDateOnly(profile.dateOfBirth) || '',
      street: profile.address?.street || '',
      city: profile.address?.city || '',
      country: profile.address?.country || '',
    });
  }

  private normalizeDateOnly(value: unknown): string | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }

      const parsed = new Date(trimmed);
      if (Number.isNaN(parsed.getTime())) {
        return null;
      }

      return parsed.toISOString().split('T')[0];
    }

    return null;
  }
}
