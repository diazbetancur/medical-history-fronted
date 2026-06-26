import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { FormControlErrorComponent } from '@shared/ui/forms/form-control-error/form-control-error.component';
import {
  PatientProfileClaimCandidateDto,
  PatientProfileClaimRequestDto,
  PatientProfileDto,
} from '@patient/models/patient-profile.dto';
import { PatientAllergiesPage } from '@patient/pages/allergies/patient-allergies/patient-allergies.page';
import { PatientBackgroundPage } from '@patient/pages/background/patient-background/patient-background.page';
import { PatientMedicationsPage } from '@patient/pages/medications/patient-medications/patient-medications.page';
import { PatientService } from '@patient/services/patient.service';
import { ExamsListComponent } from '../../components/exams/exams-list/exams-list.component';
import { PatientHistoryListComponent } from '../../components/history/patient-history-list/patient-history-list.component';
import { PrivacySettingsComponent } from '../../components/privacy/privacy-settings/privacy-settings.component';

/**
 * Profile Page Component
 *
 * Página de perfil del paciente con tabs para diferentes secciones
 */
@Component({
  selector: 'app-profile-page',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTabsModule,
    FormControlErrorComponent,
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
  readonly bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  readonly genderOptions = ['Masculino', 'Femenino', 'Otro', 'Prefiero no especificar'];
  readonly documentTypeOptions = ['DNI', 'Pasaporte', 'RNP'];
  private readonly patientService = inject(PatientService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  readonly isLoadingSummary = signal(true);
  readonly isSavingSummary = signal(false);
  readonly isEditingSummary = signal(false);
  readonly isLoadingClaims = signal(false);
  readonly isLoadingClaimCandidate = signal(false);
  readonly isRequestingClaim = signal(false);
  readonly isDecliningClaim = signal(false);
  readonly cancellingClaimId = signal<string | null>(null);
  readonly summaryError = signal<string | null>(null);
  readonly profile = signal<PatientProfileDto | null>(null);
  readonly claimCandidate = signal<PatientProfileClaimCandidateDto | null>(null);
  readonly claimRequests = signal<PatientProfileClaimRequestDto[]>([]);
  readonly todayDate = new Date();

  readonly summaryForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(200)]],
    email: [
      '',
      [Validators.required, Validators.email, Validators.maxLength(255)],
    ],
    phone: ['', [Validators.maxLength(20)]],
    documentType: [''],
    documentNumber: ['', [Validators.maxLength(30)]],
    dateOfBirth: new FormControl<Date | null>(null),
    gender: [''],
    bloodType: [''],
    countryName: ['Honduras', [Validators.maxLength(100)]],
    cityName: ['', [Validators.maxLength(100)]],
    addressLine1: ['', [Validators.maxLength(300)]],
  });

  readonly fullName = computed(() => {
    const profile = this.profile();
    if (!profile) return 'Pendiente por diligenciar';
    return profile.fullName?.trim() || 'Pendiente por diligenciar';
  });

  readonly completeAddress = computed(() => {
    const profile = this.profile();
    if (!profile) return 'Pendiente por diligenciar';
    const parts = [profile.addressLine1, profile.cityName, profile.countryName]
      .filter(Boolean)
      .join(', ');
    return parts || 'Pendiente por diligenciar';
  });

  readonly visibleClaimRequests = computed(() =>
    this.claimRequests().filter(
      (request) =>
        request.status === 0 ||
        request.status === 1 ||
        request.status === 4 ||
        request.status === 'Pending' ||
        request.status === 'Approved' ||
        request.status === 'CancellationRequested',
    ),
  );

  readonly showClaimPanel = computed(
    () =>
      !!this.claimCandidate() ||
      this.visibleClaimRequests().length > 0,
  );

  ngOnInit(): void {
    this.loadSummary();
    this.refreshClaimState();
  }

  onTabChange(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const current = this.profile();
    const raw = this.summaryForm.getRawValue();
    this.isSavingSummary.set(true);
    const locationFields = this.resolveLocationFields(current, raw);

    const request$ = current
      ? this.patientService.updateProfile({
          fullName: raw.fullName.trim(),
          email: raw.email.trim(),
          phone: this.normalizeOptionalText(raw.phone),
          documentType: this.normalizeOptionalText(raw.documentType),
          documentNumber: this.normalizeOptionalText(raw.documentNumber),
          dateOfBirth: this.normalizeDateOnly(raw.dateOfBirth),
          gender: this.normalizeOptionalText(raw.gender),
          bloodType: this.normalizeOptionalText(raw.bloodType),
          countryId: locationFields.countryId,
          cityId: locationFields.cityId,
          countryName: locationFields.countryName,
          cityName: locationFields.cityName,
          addressLine1: this.normalizeOptionalText(raw.addressLine1),
        })
      : this.patientService.createProfile({
          fullName: raw.fullName.trim(),
          email: raw.email.trim(),
          phone: this.normalizeOptionalText(raw.phone),
          documentType: this.normalizeOptionalText(raw.documentType),
          documentNumber: this.normalizeOptionalText(raw.documentNumber),
          dateOfBirth: this.normalizeDateOnly(raw.dateOfBirth),
          gender: this.normalizeOptionalText(raw.gender),
          bloodType: this.normalizeOptionalText(raw.bloodType),
          countryId: locationFields.countryId,
          cityId: locationFields.cityId,
          countryName: locationFields.countryName,
          cityName: locationFields.cityName,
          addressLine1: this.normalizeOptionalText(raw.addressLine1),
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
        this.refreshClaimState();
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

  loadClaimRequests(): void {
    this.isLoadingClaims.set(true);

    this.patientService.getMyClaimRequests().subscribe({
      next: (requests) => {
        this.claimRequests.set(requests);
        this.isLoadingClaims.set(false);
      },
      error: () => {
        this.claimRequests.set([]);
        this.isLoadingClaims.set(false);
      },
    });
  }

  loadClaimCandidate(): void {
    this.isLoadingClaimCandidate.set(true);

    this.patientService.getCurrentDocumentClaimCandidate().subscribe({
      next: (candidate) => {
        this.claimCandidate.set(candidate);
        this.isLoadingClaimCandidate.set(false);
      },
      error: () => {
        this.claimCandidate.set(null);
        this.isLoadingClaimCandidate.set(false);
      },
    });
  }

  refreshClaimState(): void {
    this.loadClaimRequests();
    this.loadClaimCandidate();
  }

  requestClaim(): void {
    if (!this.claimCandidate()) {
      return;
    }

    this.isRequestingClaim.set(true);

    this.patientService
      .requestCurrentDocumentClaim({
        notes: 'Solicitud desde perfil del paciente',
      })
      .subscribe({
        next: (request) => {
          this.isRequestingClaim.set(false);
          this.claimCandidate.set(null);
          this.claimRequests.update((items) => {
            const exists = items.some((item) => item.id === request.id);
            return exists
              ? items.map((item) => (item.id === request.id ? request : item))
              : [request, ...items];
          });
          this.snackBar.open('Solicitud enviada a revisión', 'OK', {
            duration: 3000,
          });
        },
        error: (error) => {
          this.isRequestingClaim.set(false);
          this.snackBar.open(
            error?.message ||
              'No encontramos un historial externo para tu documento',
            'Cerrar',
            { duration: 4000 },
          );
        },
      });
  }

  declineClaimCandidate(): void {
    if (!this.claimCandidate()) {
      return;
    }

    this.isDecliningClaim.set(true);

    this.patientService.declineCurrentDocumentClaim().subscribe({
      next: () => {
        this.isDecliningClaim.set(false);
        this.claimCandidate.set(null);
        this.snackBar.open('No volveremos a sugerir este historial', 'OK', {
          duration: 3000,
        });
        this.loadClaimRequests();
      },
      error: (error) => {
        this.isDecliningClaim.set(false);
        this.snackBar.open(
          error?.message || 'No se pudo guardar tu respuesta',
          'Cerrar',
          { duration: 4000 },
        );
      },
    });
  }

  requestClaimCancellation(request: PatientProfileClaimRequestDto): void {
    this.cancellingClaimId.set(request.id);

    this.patientService
      .requestClaimCancellation(request.id, 'Cancelación solicitada por paciente')
      .subscribe({
        next: (updated) => {
          this.cancellingClaimId.set(null);
          this.claimRequests.update((items) =>
            items.map((item) => (item.id === updated.id ? updated : item)),
          );
          this.snackBar.open('Cancelación enviada a revisión', 'OK', {
            duration: 3000,
          });
        },
        error: (error) => {
          this.cancellingClaimId.set(null);
          this.snackBar.open(
            error?.message || 'No se pudo solicitar la cancelación',
            'Cerrar',
            { duration: 4000 },
          );
        },
      });
  }

  claimStatusLabel(status: PatientProfileClaimRequestDto['status']): string {
    switch (status) {
      case 0:
      case 'Pending':
        return 'Pendiente';
      case 1:
      case 'Approved':
        return 'Aprobada';
      case 2:
      case 'Rejected':
        return 'Rechazada';
      case 3:
      case 'Cancelled':
        return 'Cancelada';
      case 4:
      case 'CancellationRequested':
        return 'Cancelación solicitada';
      default:
        return 'Sin estado';
    }
  }

  canCancelClaim(request: PatientProfileClaimRequestDto): boolean {
    return request.status === 0 || request.status === 'Pending';
  }

  private patchSummaryForm(profile: PatientProfileDto): void {
    this.summaryForm.patchValue({
      fullName: profile.fullName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      documentType: profile.documentType || '',
      documentNumber: profile.documentNumber || '',
      dateOfBirth: this.toDateValue(profile.dateOfBirth),
      gender: profile.gender || '',
      bloodType: profile.bloodType || '',
      countryName: profile.countryName || 'Honduras',
      cityName: profile.cityName || '',
      addressLine1: profile.addressLine1 || '',
    });
  }

  private toDateValue(value: unknown): Date | null {
    const dateOnly = this.normalizeDateOnly(value);
    if (!dateOnly) return null;
    const [year, month, day] = dateOnly.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
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

  private normalizeOptionalText(
    value: string | null | undefined,
  ): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private resolveLocationFields(
    current: PatientProfileDto | null,
    raw: {
      countryName: string;
      cityName: string;
    },
  ): {
    countryId: string | null;
    cityId: string | null;
    countryName: string | null;
    cityName: string | null;
  } {
    const countryName = this.normalizeOptionalText(raw.countryName);
    const cityName = this.normalizeOptionalText(raw.cityName);
    const currentCountryName = this.normalizeOptionalText(current?.countryName);
    const currentCityName = this.normalizeOptionalText(current?.cityName);

    const countryChanged = countryName !== currentCountryName;
    const cityChanged = cityName !== currentCityName;

    return {
      countryId: countryChanged ? null : (current?.countryId ?? null),
      cityId: countryChanged || cityChanged ? null : (current?.cityId ?? null),
      countryName,
      cityName,
    };
  }
}
