import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthStore } from '@core/auth';
import { ProblemDetails } from '@core/models';
import { ProfessionalApi, PublicApi } from '@data/api';
import {
  City,
  Country,
  CreateProfessionalProfilePayload,
  ProfessionalEducationSummary,
  ProfessionalLocation,
  ProfessionalSpecialty,
  ProfessionalSpecialtyProposal,
  PublicSpecialtyCatalogItem,
  ReplaceProfessionalSpecialtiesPayload,
  Service,
  UpdateProfessionalProfilePayload,
} from '@data/api/api-models';
import { ToastService } from '@shared/services';
import { ConfirmDialogComponent } from '@shared/ui';
import {
  ProfessionalEducationFormDialogComponent,
  ProfessionalEducationFormDialogData,
  ProfessionalEducationFormDialogResult,
} from '../professional-education-form-dialog/professional-education-form-dialog.component';
import {
  ProfessionalLocationFormDialogComponent,
  ProfessionalLocationFormDialogData,
  ProfessionalLocationFormDialogResult,
} from '../professional-location-form-dialog/professional-location-form-dialog.component';

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
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

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
  readonly availableSpecialties = signal<PublicSpecialtyCatalogItem[]>([]);
  readonly specialtyProposals = signal<ProfessionalSpecialtyProposal[]>([]);
  readonly services = signal<Service[]>([]);
  readonly education = signal<ProfessionalEducationSummary[]>([]);
  readonly locations = signal<ProfessionalLocation[]>([]);
  readonly sectionBusy = signal(false);
  readonly showServiceForm = signal(false);
  readonly editingServiceId = signal<string | null>(null);
  readonly sectionsTab = signal(0);
  readonly selectedSpecialtyIds = signal<string[]>([]);
  readonly showSpecialtyProposal = signal(false);
  readonly specialtySearchControl = new FormControl<string>('', {
    nonNullable: true,
  });
  readonly specialtyToAddControl = new FormControl<string[]>([], {
    nonNullable: true,
  });
  readonly professionalProfileId = signal<string | null>(null);
  readonly specialtiesLoaded = signal(false);
  readonly specialtiesCatalogLoaded = signal(false);
  readonly proposalsLoaded = signal(false);
  readonly servicesLoaded = signal(false);
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
    businessName: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(1500)]],
    countryId: ['', [Validators.required]],
    cityId: ['', [Validators.required]],
    phone: ['', [Validators.maxLength(20)]],
    whatsApp: ['', [Validators.maxLength(20)]],
    email: ['', [Validators.email, Validators.maxLength(100)]],
    address: ['', [Validators.maxLength(300)]],
  });

  readonly specialtyProposalForm = this.fb.nonNullable.group({
    name: [
      '',
      [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
    ],
    justification: ['', [Validators.maxLength(500)]],
  });

  readonly serviceForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    description: ['', [Validators.maxLength(1000)]],
  });

  readonly selectedSpecialties = computed(() => {
    const selectedIds = this.selectedSpecialtyIds();
    const catalogById = new Map(
      this.availableSpecialties().map((item) => [item.id, item]),
    );
    const assignedById = new Map(
      this.specialties().map((item) => [item.id, item]),
    );

    return selectedIds
      .map((id) => {
        const fromCatalog = catalogById.get(id);
        if (fromCatalog) {
          return { id: fromCatalog.id, name: fromCatalog.name };
        }

        const fromAssigned = assignedById.get(id);
        if (fromAssigned) {
          return { id: fromAssigned.id, name: fromAssigned.name };
        }

        return null;
      })
      .filter((item): item is { id: string; name: string } => !!item);
  });

  readonly availableSpecialtiesForPicker = computed(() => {
    const selected = new Set(this.selectedSpecialtyIds());
    const search = this.specialtySearchControl.value.trim().toLowerCase();

    return this.availableSpecialties().filter((item) => {
      if (selected.has(item.id)) return false;
      if (!search) return true;
      return item.name.toLowerCase().includes(search);
    });
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
  }

  private loadProfile(): void {
    this.loadingCatalogs.set(true);
    this.professionalApi.getProfile().subscribe({
      next: (profile) => {
        this.hasExistingProfile.set(true);
        this.professionalProfileId.set(profile.id);
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
        this.loadingCatalogs.set(false);
      },
      error: () => {
        this.hasExistingProfile.set(false);
        this.professionalProfileId.set(null);
        this.loadCatalogs();
      },
    });
  }

  private getCurrentProfessionalProfileId(): string | null {
    return (
      this.currentUser()?.professionalProfileId ?? this.professionalProfileId()
    );
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

  private loadSpecialtiesCatalog(force = false): void {
    if (this.specialtiesCatalogLoaded() && !force) return;

    this.publicApi.getSpecialties().subscribe({
      next: (items) => {
        this.availableSpecialties.set(items ?? []);
        this.specialtiesCatalogLoaded.set(true);
      },
      error: () => {
        this.availableSpecialties.set([]);
      },
    });
  }

  private loadSpecialtiesBlock(force = false): void {
    if (this.specialtiesLoaded() && this.proposalsLoaded() && !force) return;

    this.loadSpecialtiesCatalog(force);
    this.sectionBusy.set(true);
    const professionalProfileId = this.getCurrentProfessionalProfileId();
    const specialtiesRequest$ = professionalProfileId
      ? this.professionalApi.getProfessionalSpecialtiesByProfile(
          professionalProfileId,
        )
      : this.professionalApi.getSpecialties();

    specialtiesRequest$.subscribe({
      next: (specialties) => {
        this.specialties.set(specialties);
        this.selectedSpecialtyIds.set(specialties.map((item) => item.id));
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

  addSpecialtyToSelection(): void {
    const specialtyIds = this.specialtyToAddControl.value;
    if (!specialtyIds.length) return;

    const current = this.selectedSpecialtyIds();
    const idsToAdd = specialtyIds.filter((id) => !current.includes(id));
    if (!idsToAdd.length) {
      this.specialtyToAddControl.setValue([]);
      return;
    }

    const updatedSelection = [...current, ...idsToAdd];
    this.saveSpecialties(updatedSelection);

    this.specialtyToAddControl.setValue([]);
  }

  saveSpecialties(specialtyIds = this.selectedSpecialtyIds()): void {
    const payload: ReplaceProfessionalSpecialtiesPayload = {
      specialties: specialtyIds.map((specialtyId) => ({
        specialtyId,
        isPrimary: false,
      })),
    };

    this.sectionBusy.set(true);
    this.professionalApi.replaceSpecialties(payload).subscribe({
      next: (result) => {
        this.specialties.set(result);
        this.selectedSpecialtyIds.set(result.map((item) => item.id));
        this.specialtiesLoaded.set(true);
        this.toast.success('Especialidades guardadas');
        this.sectionBusy.set(false);
      },
      error: () => {
        this.toast.error('No fue posible guardar las especialidades');
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

  private loadServicesBlock(force = false): void {
    if (this.servicesLoaded() && !force) return;

    this.sectionBusy.set(true);
    this.professionalApi.getServices().subscribe({
      next: (items) => {
        this.services.set(items ?? []);
        this.servicesLoaded.set(true);
        this.sectionBusy.set(false);
      },
      error: () => {
        this.toast.error('No fue posible cargar los servicios');
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
    if (index === 1) {
      this.loadSpecialtiesBlock();
      return;
    }
    if (index === 2) {
      this.loadServicesBlock();
      return;
    }
    if (index === 3) {
      this.loadEducationBlock();
      return;
    }
    if (index === 4) {
      this.loadLocationsBlock();
    }
  }

  startCreateService(): void {
    this.editingServiceId.set(null);
    this.serviceForm.reset({
      name: '',
      description: '',
    });
    this.showServiceForm.set(true);
  }

  editService(service: Service): void {
    this.editingServiceId.set(service.id);
    this.serviceForm.patchValue({
      name: service.name,
      description: service.description ?? '',
    });
    this.showServiceForm.set(true);
  }

  cancelServiceEdit(): void {
    this.editingServiceId.set(null);
    this.serviceForm.reset({
      name: '',
      description: '',
    });
    this.showServiceForm.set(false);
  }

  saveService(): void {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }

    const value = this.serviceForm.getRawValue();
    const payload = {
      name: value.name.trim(),
      description: value.description.trim() || undefined,
      priceFrom: 0,
      priceTo: 0,
      duration: '0',
      sortOrder: 1,
    };

    const editingId = this.editingServiceId();
    this.sectionBusy.set(true);

    const request$ = editingId
      ? this.professionalApi.updateService(editingId, payload)
      : this.professionalApi.createService(payload);

    request$.subscribe({
      next: (service) => {
        if (editingId) {
          this.services.update((current) =>
            current.map((item) => (item.id === service.id ? service : item)),
          );
        } else {
          this.services.update((current) => [service, ...current]);
        }

        this.servicesLoaded.set(true);
        this.cancelServiceEdit();
        this.toast.success(
          editingId ? 'Servicio actualizado' : 'Servicio agregado',
        );
        this.sectionBusy.set(false);
      },
      error: () => {
        this.toast.error('No fue posible guardar el servicio');
        this.sectionBusy.set(false);
      },
    });
  }

  deleteService(serviceId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Eliminar servicio',
        message: '¿Estás seguro de eliminar este servicio?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn',
        icon: 'delete_forever',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.sectionBusy.set(true);
      this.professionalApi.deleteService(serviceId).subscribe({
        next: () => {
          this.services.update((current) =>
            current.filter((item) => item.id !== serviceId),
          );
          this.servicesLoaded.set(true);
          this.toast.success('Servicio eliminado');
          this.sectionBusy.set(false);
        },
        error: () => {
          this.toast.error('No fue posible eliminar el servicio');
          this.sectionBusy.set(false);
        },
      });
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const value = this.profileForm.getRawValue();
    const payload: CreateProfessionalProfilePayload = {
      businessName: value.businessName.trim(),
      description: value.description.trim() || undefined,
      countryId: value.countryId,
      cityId: value.cityId,
      phone: value.phone.trim() || undefined,
      whatsApp: value.whatsApp.trim() || undefined,
      email: value.email.trim() || undefined,
      address: value.address.trim() || undefined,
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
            : 'Perfil creado. Continúa con especialidades, formación y sedes.',
        );
        this.authStore.loadMe().subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.hasExistingProfile.set(true);
            this.sectionsTab.set(1);
            this.loadSpecialtiesBlock(true);
          },
          error: () => {
            this.isSubmitting.set(false);
            this.hasExistingProfile.set(true);
            this.sectionsTab.set(1);
            this.loadSpecialtiesBlock(true);
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

  submitSpecialtyProposal(): void {
    if (this.specialtyProposalForm.invalid) {
      this.specialtyProposalForm.markAllAsTouched();
      return;
    }

    const value = this.specialtyProposalForm.getRawValue();
    this.sectionBusy.set(true);
    this.professionalApi
      .createSpecialtyProposal({
        name: value.name.trim(),
        justification: value.justification.trim() || undefined,
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

  openCreateEducationDialog(): void {
    const dialogRef = this.dialog.open(
      ProfessionalEducationFormDialogComponent,
      {
        width: '720px',
        maxWidth: '96vw',
        data: {
          title: 'Crear formación',
          submitLabel: 'Crear formación',
          educationTypeOptions: this.educationTypeOptions,
        } satisfies ProfessionalEducationFormDialogData,
      },
    );

    dialogRef
      .afterClosed()
      .subscribe((result?: ProfessionalEducationFormDialogResult) => {
        if (!result) return;
        this.saveEducationFromDialog(result);
      });
  }

  openEditEducationDialog(item: ProfessionalEducationSummary): void {
    const dialogRef = this.dialog.open(
      ProfessionalEducationFormDialogComponent,
      {
        width: '720px',
        maxWidth: '96vw',
        data: {
          title: 'Editar formación',
          submitLabel: 'Guardar cambios',
          educationTypeOptions: this.educationTypeOptions,
          initial: {
            type: item.type,
            degreeTitle: item.degreeTitle,
            institutionName: item.institutionName,
            institutionCountry: item.institutionCountry ?? '',
            startYear: item.startYear,
            graduationYear: item.graduationYear,
            description: item.description ?? '',
          },
        } satisfies ProfessionalEducationFormDialogData,
      },
    );

    dialogRef
      .afterClosed()
      .subscribe((result?: ProfessionalEducationFormDialogResult) => {
        if (!result) return;
        this.saveEducationFromDialog(result, item.id);
      });
  }

  private saveEducationFromDialog(
    value: ProfessionalEducationFormDialogResult,
    editingId?: string,
  ): void {
    const payload = {
      type: Number(value.type) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
      degreeTitle: value.degreeTitle,
      institutionName: value.institutionName,
      institutionCountry: value.institutionCountry || undefined,
      startYear: value.startYear ?? undefined,
      graduationYear: value.graduationYear ?? undefined,
      description: value.description || undefined,
      sortOrder: 1,
    };

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

  removeSpecialtyFromSelection(specialtyId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Eliminar especialidad',
        message: '¿Estás seguro de eliminar esta especialidad?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn',
        icon: 'delete_forever',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      const isPersisted = this.specialties().some(
        (item) => item.id === specialtyId,
      );

      if (!isPersisted) {
        this.selectedSpecialtyIds.update((current) =>
          current.filter((id) => id !== specialtyId),
        );
        return;
      }

      this.sectionBusy.set(true);
      this.professionalApi.deleteSpecialty(specialtyId).subscribe({
        next: () => {
          this.specialties.update((current) =>
            current.filter((item) => item.id !== specialtyId),
          );
          this.selectedSpecialtyIds.update((current) =>
            current.filter((id) => id !== specialtyId),
          );
          this.specialtiesLoaded.set(true);
          this.toast.success('Especialidad eliminada');
          this.sectionBusy.set(false);
        },
        error: () => {
          this.toast.error('No fue posible eliminar la especialidad');
          this.sectionBusy.set(false);
        },
      });
    });
  }

  deleteEducation(id: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Eliminar formación',
        message: '¿Estás seguro de eliminar este registro de formación?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn',
        icon: 'delete_forever',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

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
    });
  }

  openCreateLocationDialog(): void {
    this.openLocationDialog();
  }

  openEditLocationDialog(location: ProfessionalLocation): void {
    this.openLocationDialog(location);
  }

  private openLocationDialog(location?: ProfessionalLocation): void {
    const dialogRef = this.dialog.open(ProfessionalLocationFormDialogComponent, {
      width: '720px',
      maxWidth: '96vw',
      data: {
        title: location ? 'Editar sede' : 'Adicionar sede',
        submitLabel: location ? 'Guardar cambios' : 'Guardar sede',
        initial: location
          ? {
              name: location.name,
              address: location.address ?? '',
              phone: location.phone ?? '',
              cityId: location.cityId,
              cityName: location.cityName,
              countryId: location.countryId,
              countryName: location.countryName,
            }
          : undefined,
      } satisfies ProfessionalLocationFormDialogData,
    });

    dialogRef
      .afterClosed()
      .subscribe((result?: ProfessionalLocationFormDialogResult) => {
        if (!result) return;
        this.saveLocationFromDialog(result, location?.id);
      });
  }

  private saveLocationFromDialog(
    value: ProfessionalLocationFormDialogResult,
    editingId?: string,
  ): void {
    const payload = {
      name: value.name,
      address: value.address,
      countryId: value.countryId,
      cityId: value.cityId,
      phone: value.phone,
    };

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
