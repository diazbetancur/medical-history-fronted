import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { AuthStore } from '@core/auth';
import { ProblemDetails } from '@core/models';
import { ProfessionalApi, PublicApi } from '@data/api';
import {
  AssignProfessionalSpecialtiesPayload,
  City,
  Country,
  CreateProfessionalProfilePayload,
  ProfessionalEducationSummary,
  ProfessionalLocation,
  ProfessionalSpecialty,
  ProfessionalSpecialtyProposal,
  UpdateProfessionalProfilePayload,
} from '@data/api/api-models';
import { ToastService } from '@shared/services';

@Component({
  selector: 'app-professional-onboarding',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
    MatTabsModule,
  ],
  templateUrl: './professional-onboarding.page.html',
  styleUrls: ['./professional-onboarding.page.scss'],
})
export class ProfessionalOnboardingPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly professionalApi = inject(ProfessionalApi);
  private readonly publicApi = inject(PublicApi);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // ─── Catalog data ──────────────────────────────────────────────────────────
  readonly countries = signal<Country[]>([]);
  readonly cities = signal<City[]>([]);
  readonly filteredCities = computed(() => {
    const countryId = this.profileForm.get('countryId')?.value;
    if (!countryId) return this.cities();
    return this.cities().filter((c) => c.countryId === countryId);
  });

  // ─── Status ────────────────────────────────────────────────────────────────
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly loadingCatalogs = signal(true);
  readonly hasExistingProfile = signal(false);
  readonly profileImageUrl = signal<string | null>(null);
  readonly isUploadingPhoto = signal(false);
  readonly specialties = signal<ProfessionalSpecialty[]>([]);
  readonly specialtyProposals = signal<ProfessionalSpecialtyProposal[]>([]);
  readonly education = signal<ProfessionalEducationSummary[]>([]);
  readonly locations = signal<ProfessionalLocation[]>([]);
  readonly sectionBusy = signal(false);
  readonly editingEducationId = signal<string | null>(null);
  readonly editingLocationId = signal<string | null>(null);
  readonly sectionsTab = signal(0);
  readonly specialtiesLoaded = signal(false);
  readonly proposalsLoaded = signal(false);
  readonly educationLoaded = signal(false);
  readonly locationsLoaded = signal(false);

  readonly educationTypeOptions: Array<{ value: number; label: string }> = [
    { value: 0, label: 'Pregrado' },
    { value: 1, label: 'Posgrado' },
    { value: 2, label: 'Especialización' },
    { value: 3, label: 'Maestría' },
    { value: 4, label: 'Doctorado' },
    { value: 5, label: 'Diplomado' },
    { value: 6, label: 'Curso' },
    { value: 7, label: 'Otro' },
  ];

  // ─── Form ──────────────────────────────────────────────────────────────────
  readonly profileForm = this.fb.nonNullable.group({
    businessName: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(2000)]],
    countryId: ['', [Validators.required]],
    cityId: ['', [Validators.required]],
    phone: ['', [Validators.maxLength(20)]],
    whatsApp: ['', [Validators.maxLength(20)]],
    email: ['', [Validators.email, Validators.maxLength(100)]],
    address: ['', [Validators.maxLength(500)]],
  });

  readonly specialtyProposalForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    justification: ['', [Validators.maxLength(500)]],
  });

  readonly educationForm = this.fb.group({
    institution: ['', [Validators.required, Validators.maxLength(200)]],
    degree: ['', [Validators.required, Validators.maxLength(200)]],
    educationType: [0, [Validators.required]],
    startYear: [null as number | null],
    endYear: [null as number | null],
    country: ['', [Validators.maxLength(120)]],
  });

  readonly locationForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    address: ['', [Validators.maxLength(300)]],
    countryId: ['', [Validators.required]],
    cityId: ['', [Validators.required]],
    phone: ['', [Validators.maxLength(30)]],
  });

  readonly filteredLocationCities = computed(() => {
    const countryId = this.locationForm.get('countryId')?.value;
    if (!countryId) return this.cities();
    return this.cities().filter((city) => city.countryId === countryId);
  });

  // ─── User info ─────────────────────────────────────────────────────────────
  readonly currentUser = this.authStore.user;

  ngOnInit(): void {
    this.loadProfile();
    this.prefillEmailFromUser();
    // When country changes, reset city
    this.profileForm.get('countryId')?.valueChanges.subscribe(() => {
      this.profileForm.get('cityId')?.reset('');
    });
    this.locationForm.get('countryId')?.valueChanges.subscribe(() => {
      this.locationForm.get('cityId')?.reset('');
    });
  }

  private loadProfile(): void {
    this.loadingCatalogs.set(true);
    this.professionalApi.getProfile().subscribe({
      next: (profile) => {
        this.hasExistingProfile.set(true);
        this.countries.set([
          {
            id: profile.countryId,
            name: profile.countryName,
            slug: profile.countryName.toLowerCase().replace(/\s+/g, '-'),
          },
        ]);
        this.cities.set([
          {
            id: profile.cityId,
            name: profile.cityName,
            slug: profile.cityName.toLowerCase().replace(/\s+/g, '-'),
            countryId: profile.countryId,
          },
        ]);
        this.profileForm.patchValue(
          {
            businessName: profile.businessName,
            description: profile.description ?? '',
            countryId: profile.countryId,
            cityId: profile.cityId,
            phone: profile.phone ?? '',
            whatsApp: profile.whatsApp ?? '',
            email: profile.email ?? '',
            address: profile.address ?? '',
          },
          { emitEvent: false },
        );
        this.profileImageUrl.set(profile.profileImageUrl ?? null);
        this.loadSpecialtiesBlock();
        this.loadingCatalogs.set(false);
      },
      error: () => {
        this.hasExistingProfile.set(false);
        this.loadCatalogs();
      },
    });
  }

  private prefillEmailFromUser(): void {
    const email = this.currentUser()?.email;
    if (email) {
      this.profileForm.patchValue({ email });
    }
  }

  private loadCatalogs(): void {
    this.loadingCatalogs.set(true);
    this.publicApi.getMetadata().subscribe({
      next: (meta) => {
        this.countries.set(meta.countries ?? []);
        this.cities.set(meta.cities ?? []);
        this.loadingCatalogs.set(false);
      },
      error: () => {
        this.loadingCatalogs.set(false);
      },
    });
  }

  private loadSpecialtiesBlock(force = false): void {
    if (this.specialtiesLoaded() && this.proposalsLoaded() && !force) return;

    this.sectionBusy.set(true);
    this.professionalApi.getSpecialties().subscribe({
      next: (specialties) => {
        this.specialties.set(specialties);
        this.specialtiesLoaded.set(true);
        this.professionalApi.getSpecialtyProposals().subscribe({
          next: (proposals) => {
            this.specialtyProposals.set(proposals);
            this.proposalsLoaded.set(true);
            this.sectionBusy.set(false);
          },
          error: () => {
            this.sectionBusy.set(false);
          },
        });
      },
      error: () => {
        this.sectionBusy.set(false);
      },
    });
  }

  private loadEducationBlock(force = false): void {
    if (this.educationLoaded() && !force) return;

    this.sectionBusy.set(true);
    this.professionalApi.getEducation().subscribe({
      next: (education) => {
        this.education.set(education);
        this.educationLoaded.set(true);
        this.sectionBusy.set(false);
      },
      error: () => {
        this.sectionBusy.set(false);
      },
    });
  }

  private loadLocationsBlock(force = false): void {
    if (this.locationsLoaded() && !force) return;

    this.sectionBusy.set(true);
    this.professionalApi.getLocations(true).subscribe({
      next: (locations) => {
        this.locations.set(locations);
        this.locationsLoaded.set(true);
        this.sectionBusy.set(false);
      },
      error: () => {
        this.sectionBusy.set(false);
      },
    });
  }

  onSectionsTabChange(index: number): void {
    this.sectionsTab.set(index);
    if (index === 0) {
      this.loadSpecialtiesBlock();
      return;
    }
    if (index === 1) {
      this.loadEducationBlock();
      return;
    }
    this.loadLocationsBlock();
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const value = this.profileForm.getRawValue();
    const payload: CreateProfessionalProfilePayload = {
      businessName: value.businessName,
      description: value.description || undefined,
      countryId: value.countryId,
      cityId: value.cityId,
      phone: value.phone || undefined,
      whatsApp: value.whatsApp || undefined,
      email: value.email || undefined,
      address: value.address || undefined,
    };

    const request$ = this.hasExistingProfile()
      ? this.professionalApi.updateProfile(
          payload as UpdateProfessionalProfilePayload,
        )
      : this.professionalApi.createProfile(payload);

    request$.subscribe({
      next: () => {
        this.toast.success(
          this.hasExistingProfile()
            ? 'Perfil actualizado exitosamente.'
            : '¡Perfil creado! Ya puedes empezar a trabajar.',
        );
        // Reload user session to get updated contexts/hasProfessionalProfile
        this.authStore.loadMe().subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.router.navigate(['/professional']);
          },
          error: () => {
            this.isSubmitting.set(false);
            this.router.navigate(['/professional']);
          },
        });
      },
      error: (err) => {
        this.submitError.set(
          this.extractError(err) ||
            'No fue posible crear tu perfil. Intenta nuevamente.',
        );
        this.isSubmitting.set(false);
      },
    });
  }

  onPhotoSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    this.isUploadingPhoto.set(true);
    this.professionalApi.uploadProfilePhoto(file).subscribe({
      next: (response) => {
        this.profileImageUrl.set(response.profileImageUrl);
        this.toast.success('Foto de perfil actualizada');
        this.isUploadingPhoto.set(false);
      },
      error: () => {
        this.toast.error('No fue posible subir la foto');
        this.isUploadingPhoto.set(false);
      },
    });

    target.value = '';
  }

  removePhoto(): void {
    this.isUploadingPhoto.set(true);
    this.professionalApi.deleteProfilePhoto().subscribe({
      next: () => {
        this.profileImageUrl.set(null);
        this.toast.success('Foto eliminada');
        this.isUploadingPhoto.set(false);
      },
      error: () => {
        this.toast.error('No fue posible eliminar la foto');
        this.isUploadingPhoto.set(false);
      },
    });
  }

  removeSpecialty(specialtyId: string): void {
    const remainingIds = this.specialties()
      .filter((item) => item.id !== specialtyId)
      .map((item) => item.id);

    const payload: AssignProfessionalSpecialtiesPayload = {
      specialtyIds: remainingIds,
    };

    this.sectionBusy.set(true);
    this.professionalApi.assignSpecialties(payload).subscribe({
      next: (result) => {
        this.specialties.set(result);
        this.toast.success('Especialidades actualizadas');
        this.specialtiesLoaded.set(true);
        this.sectionBusy.set(false);
      },
      error: () => {
        this.toast.error('No fue posible actualizar especialidades');
        this.sectionBusy.set(false);
      },
    });
  }

  submitSpecialtyProposal(): void {
    if (this.specialtyProposalForm.invalid) {
      this.specialtyProposalForm.markAllAsTouched();
      return;
    }

    const value = this.specialtyProposalForm.getRawValue();
    this.sectionBusy.set(true);
    this.professionalApi
      .createSpecialtyProposal({
        name: value.name,
        justification: value.justification || undefined,
      })
      .subscribe({
        next: (created) => {
          this.specialtyProposals.update((current) => [created, ...current]);
          this.proposalsLoaded.set(true);
          this.specialtyProposalForm.reset({ name: '', justification: '' });
          this.toast.success('Propuesta enviada');
          this.sectionBusy.set(false);
        },
        error: () => {
          this.toast.error('No fue posible enviar la propuesta');
          this.sectionBusy.set(false);
        },
      });
  }

  saveEducation(): void {
    if (this.educationForm.invalid) {
      this.educationForm.markAllAsTouched();
      return;
    }

    const value = this.educationForm.getRawValue();
    const payload = {
      institution: value.institution ?? '',
      degree: value.degree ?? '',
      educationType: Number(value.educationType) as
        | 0
        | 1
        | 2
        | 3
        | 4
        | 5
        | 6
        | 7,
      startYear: value.startYear ?? undefined,
      endYear: value.endYear ?? undefined,
      country: value.country || undefined,
    };

    const editingId = this.editingEducationId();
    this.sectionBusy.set(true);

    const request$ = editingId
      ? this.professionalApi.updateEducation(editingId, payload)
      : this.professionalApi.createEducation(payload);

    request$.subscribe({
      next: (item) => {
        if (editingId) {
          this.education.update((current) =>
            current.map((entry) => (entry.id === item.id ? item : entry)),
          );
        } else {
          this.education.update((current) => [item, ...current]);
        }
        this.cancelEducationEdit();
        this.educationLoaded.set(true);
        this.toast.success(
          editingId ? 'Formación actualizada' : 'Formación agregada',
        );
        this.sectionBusy.set(false);
      },
      error: () => {
        this.toast.error('No fue posible guardar la formación');
        this.sectionBusy.set(false);
      },
    });
  }

  editEducation(item: ProfessionalEducationSummary): void {
    this.editingEducationId.set(item.id);
    this.educationForm.patchValue({
      institution: item.institution,
      degree: item.degree,
      educationType: item.educationType,
      startYear: item.startYear,
      endYear: item.endYear,
      country: item.country ?? '',
    });
  }

  cancelEducationEdit(): void {
    this.editingEducationId.set(null);
    this.educationForm.reset({
      institution: '',
      degree: '',
      educationType: 0,
      startYear: null,
      endYear: null,
      country: '',
    });
  }

  deleteEducation(id: string): void {
    this.sectionBusy.set(true);
    this.professionalApi.deleteEducation(id).subscribe({
      next: () => {
        this.education.update((current) =>
          current.filter((entry) => entry.id !== id),
        );
        this.educationLoaded.set(true);
        this.toast.success('Formación eliminada');
        this.sectionBusy.set(false);
      },
      error: () => {
        this.toast.error('No fue posible eliminar la formación');
        this.sectionBusy.set(false);
      },
    });
  }

  onDiplomaSelected(event: Event, educationId: string): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    this.sectionBusy.set(true);
    this.professionalApi.uploadEducationDiploma(educationId, file).subscribe({
      next: () => {
        this.education.update((current) =>
          current.map((entry) =>
            entry.id === educationId ? { ...entry, hasDiploma: true } : entry,
          ),
        );
        this.educationLoaded.set(true);
        this.toast.success('Diploma cargado');
        this.sectionBusy.set(false);
      },
      error: () => {
        this.toast.error('No fue posible cargar el diploma');
        this.sectionBusy.set(false);
      },
    });

    target.value = '';
  }

  deleteDiploma(educationId: string): void {
    this.sectionBusy.set(true);
    this.professionalApi.deleteEducationDiploma(educationId).subscribe({
      next: () => {
        this.education.update((current) =>
          current.map((entry) =>
            entry.id === educationId ? { ...entry, hasDiploma: false } : entry,
          ),
        );
        this.educationLoaded.set(true);
        this.toast.success('Diploma eliminado');
        this.sectionBusy.set(false);
      },
      error: () => {
        this.toast.error('No fue posible eliminar el diploma');
        this.sectionBusy.set(false);
      },
    });
  }

  saveLocation(): void {
    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      return;
    }

    const value = this.locationForm.getRawValue();
    const payload = {
      name: value.name,
      address: value.address || undefined,
      countryId: value.countryId,
      cityId: value.cityId,
      phone: value.phone || undefined,
    };

    const editingId = this.editingLocationId();
    this.sectionBusy.set(true);

    const request$ = editingId
      ? this.professionalApi.updateLocation(editingId, payload)
      : this.professionalApi.createLocation(payload);

    request$.subscribe({
      next: (location) => {
        if (editingId) {
          this.locations.update((current) =>
            current.map((entry) =>
              entry.id === location.id ? location : entry,
            ),
          );
        } else {
          this.locations.update((current) => [location, ...current]);
        }
        this.cancelLocationEdit();
        this.locationsLoaded.set(true);
        this.toast.success(editingId ? 'Sede actualizada' : 'Sede agregada');
        this.sectionBusy.set(false);
      },
      error: () => {
        this.toast.error('No fue posible guardar la sede');
        this.sectionBusy.set(false);
      },
    });
  }

  editLocation(location: ProfessionalLocation): void {
    this.editingLocationId.set(location.id);
    this.locationForm.patchValue({
      name: location.name,
      address: location.address ?? '',
      countryId: location.countryId,
      cityId: location.cityId,
      phone: location.phone ?? '',
    });
  }

  cancelLocationEdit(): void {
    this.editingLocationId.set(null);
    this.locationForm.reset({
      name: '',
      address: '',
      countryId: '',
      cityId: '',
      phone: '',
    });
  }

  setDefaultLocation(locationId: string): void {
    this.sectionBusy.set(true);
    this.professionalApi.setDefaultLocation(locationId).subscribe({
      next: () => {
        this.locations.update((current) =>
          current.map((entry) => ({
            ...entry,
            isDefault: entry.id === locationId,
          })),
        );
        this.locationsLoaded.set(true);
        this.toast.success('Sede principal actualizada');
        this.sectionBusy.set(false);
      },
      error: () => {
        this.toast.error('No fue posible actualizar la sede principal');
        this.sectionBusy.set(false);
      },
    });
  }

  deleteLocation(locationId: string): void {
    this.sectionBusy.set(true);
    this.professionalApi.deleteLocation(locationId).subscribe({
      next: () => {
        this.locations.update((current) =>
          current.filter((entry) => entry.id !== locationId),
        );
        this.locationsLoaded.set(true);
        this.toast.success('Sede eliminada');
        this.sectionBusy.set(false);
      },
      error: () => {
        this.toast.error('No fue posible eliminar la sede');
        this.sectionBusy.set(false);
      },
    });
  }

  private extractError(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const e = (error as any).error;
      if (typeof e === 'object') {
        return (e as Partial<ProblemDetails>).title ?? e?.message ?? '';
      }
    }
    return '';
  }
}
