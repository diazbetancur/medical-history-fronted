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
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    documentType: [''],
    documentNumber: [''],
    dateOfBirth: ['', [Validators.required]],
    gender: [''],
    bloodType: [''],
    countryName: [''],
    cityName: [''],
    addressLine1: [''],
  });

  readonly fullName = computed(() => {
    const profile = this.profile();
    if (!profile) return 'No disponible';
    return profile.fullName?.trim() || 'No disponible';
  });

  readonly completeAddress = computed(() => {
    const profile = this.profile();
    if (!profile) return 'No disponible';
    const parts = [profile.addressLine1, profile.cityName, profile.countryName]
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
          fullName: raw.fullName,
          email: raw.email,
          phone: raw.phone,
          documentType: raw.documentType || null,
          documentNumber: raw.documentNumber || null,
          dateOfBirth: raw.dateOfBirth,
          gender: raw.gender || null,
          bloodType: raw.bloodType || null,
          countryId: current.countryId ?? null,
          cityId: current.cityId ?? null,
          countryName: raw.countryName || null,
          cityName: raw.cityName || null,
          addressLine1: raw.addressLine1 || null,
        })
      : this.patientService.createProfile({
          fullName: raw.fullName,
          email: raw.email,
          phone: raw.phone,
          documentType: raw.documentType || null,
          documentNumber: raw.documentNumber || null,
          dateOfBirth: raw.dateOfBirth,
          gender: raw.gender || null,
          bloodType: raw.bloodType || null,
          countryId: null,
          cityId: null,
          countryName: raw.countryName || null,
          cityName: raw.cityName || null,
          addressLine1: raw.addressLine1 || null,
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
      fullName: profile.fullName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      documentType: profile.documentType || '',
      documentNumber: profile.documentNumber || '',
      dateOfBirth: this.normalizeDateOnly(profile.dateOfBirth) || '',
      gender: profile.gender || '',
      bloodType: profile.bloodType || '',
      countryName: profile.countryName || '',
      cityName: profile.cityName || '',
      addressLine1: profile.addressLine1 || '',
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
