import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { ApiError, getUserMessage } from '@core/http/api-error';
import { PublicApi } from '@data/api';
import { City } from '@data/api/api-models';
import { BookAppointmentDialogComponent } from '@features/public/components/book-appointment-dialog.component';
import { ToastService } from '@shared/services/toast.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  getInitials,
  ProfessionalSearchResultDto,
} from '../../../public/models/professional-search.dto';
import { SpecialtyDto } from '../../../public/models/specialty.dto';
import { PublicCatalogService } from '../../../public/services/public-catalog.service';
import { PublicProfessionalsService } from '../../../public/services/public-professionals.service';
import { PatientProfileDto } from '../../models/patient-profile.dto';
import { SlotDto } from '../../models/slot.dto';
import {
  AppointmentsService,
  RelatedProfessionalDto,
} from '../../services/appointments.service';

export interface SelectedProfessional {
  professionalProfileId: string;
  slug: string;
  name: string;
  specialty?: string;
}

interface SpecialtyOption {
  id: string;
  name: string;
  slug?: string;
}

export class WizardStore {
  private readonly _profile = signal<PatientProfileDto | null>(null);
  readonly profile = this._profile.asReadonly();

  private readonly _selectedProfessional = signal<SelectedProfessional | null>(
    null,
  );
  readonly selectedProfessional = this._selectedProfessional.asReadonly();

  private readonly _selectedDate = signal<string | null>(null);
  private readonly _selectedSlot = signal<SlotDto | null>(null);
  readonly selectedDate = this._selectedDate.asReadonly();
  readonly selectedSlot = this._selectedSlot.asReadonly();

  readonly isStep1Complete = computed(() => !!this._profile());
  readonly isStep2Complete = computed(() => !!this._selectedProfessional());
  readonly isStep3Complete = computed(
    () => !!this._selectedDate() && !!this._selectedSlot(),
  );

  setProfile(profile: PatientProfileDto): void {
    this._profile.set(profile);
  }

  setProfessional(professional: SelectedProfessional): void {
    this._selectedProfessional.set(professional);
  }

  setDateAndSlot(date: string, slot: SlotDto): void {
    this._selectedDate.set(date);
    this._selectedSlot.set(slot);
  }

  reset(): void {
    this._profile.set(null);
    this._selectedProfessional.set(null);
    this._selectedDate.set(null);
    this._selectedSlot.set(null);
  }
}

@Component({
  selector: 'app-patient-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './patient-wizard.page.html',
  styleUrl: './patient-wizard.page.scss',
})
export class PatientWizardPage implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly professionalsService = inject(PublicProfessionalsService);
  private readonly catalogService = inject(PublicCatalogService);
  private readonly publicApi = inject(PublicApi);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly searchControl = new FormControl<string>('');
  readonly specialtyControl = new FormControl<string | null>(null);
  readonly cityControl = new FormControl<string | null>(null);

  readonly loading = signal(false);
  readonly hasSearched = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly specialties = signal<SpecialtyOption[]>([]);
  readonly cities = signal<City[]>([]);
  readonly professionals = signal<ProfessionalSearchResultDto[]>([]);
  readonly listTitle = signal('Médicos con los que has tenido relación');

  readonly getInitials = getInitials;
  readonly hasResults = computed(() => this.professionals().length > 0);

  ngOnInit(): void {
    this.loadCatalogs();
    this.setupDebounce();
    this.loadInitialProfessionals();
  }

  searchProfessionals(): void {
    const queryText = this.searchControl.value?.trim();
    const selectedSpecialtyId = this.normalizeGuid(this.specialtyControl.value);
    const selectedCityId = this.normalizeGuid(this.cityControl.value);

    this.loading.set(true);
    this.errorMessage.set(null);
    this.hasSearched.set(true);
    this.listTitle.set('Resultados de búsqueda');

    this.professionalsService
      .search({
        q: queryText || undefined,
        specialtyId: selectedSpecialtyId,
        cityId: selectedCityId,
        page: 1,
        pageSize: 10,
      })
      .subscribe({
        next: (response) => {
          this.professionals.set(response.professionals ?? []);
          this.loading.set(false);
        },
        error: (error: ApiError) => {
          this.errorMessage.set(getUserMessage(error));
          this.professionals.set([]);
          this.loading.set(false);
        },
      });
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.specialtyControl.setValue(null);
    this.cityControl.setValue(null);
    this.hasSearched.set(false);
    this.loadInitialProfessionals();
  }

  viewProfile(item: ProfessionalSearchResultDto): void {
    if (!item.slug) {
      this.toast.warning('Este profesional no tiene perfil público disponible');
      return;
    }

    this.router.navigate(['/pro', item.slug]);
  }

  bookAppointment(item: ProfessionalSearchResultDto): void {
    if (!item.slug) {
      this.toast.warning('No pudimos abrir el perfil para agendar la cita');
      return;
    }

    this.dialog.open(BookAppointmentDialogComponent, {
      width: '760px',
      maxWidth: '96vw',
      data: {
        slug: item.slug,
        professionalId: item.professionalProfileId,
        name: item.fullName,
        imageUrl: item.photoUrl,
        specialties: item.specialties.map(
          (specialty: { name: string }) => specialty.name,
        ),
      },
    });
  }

  retryInitialLoad(): void {
    this.hasSearched.set(false);
    this.loadInitialProfessionals();
  }

  goBackHome(): void {
    this.router.navigate(['/patient']);
  }

  onSearchClick(): void {
    this.searchProfessionals();
  }

  hasSearchText(): boolean {
    return !!this.searchControl.value?.trim();
  }

  searchPlaceholder(): string {
    return 'Nombre o especialidad';
  }

  sectionSubtitle(): string {
    if (this.listTitle() === 'Médicos con los que has tenido relación') {
      return 'Basado en tus citas previas.';
    }
    if (this.listTitle() === 'Médicos recomendados') {
      return 'Te mostramos opciones disponibles para comenzar.';
    }
    return 'Puedes ver perfil o agendar directamente.';
  }

  trackByProfessional(_: number, item: ProfessionalSearchResultDto): string {
    return item.professionalProfileId;
  }

  primarySpecialty(item: ProfessionalSearchResultDto): string {
    return item.specialties[0]?.name ?? 'Especialidad no disponible';
  }

  visibleSpecialties(item: ProfessionalSearchResultDto): Array<{
    id: string;
    name: string;
  }> {
    return (item.specialties ?? []).slice(0, 1);
  }

  remainingSpecialtiesCount(item: ProfessionalSearchResultDto): number {
    const count = (item.specialties ?? []).length - 1;
    return count > 0 ? count : 0;
  }

  hasLocation(item: ProfessionalSearchResultDto): boolean {
    return !!item.city || !!item.country;
  }

  locationText(item: ProfessionalSearchResultDto): string {
    return [item.city, item.country].filter((value) => !!value).join(', ');
  }

  experienceText(item: ProfessionalSearchResultDto): string | null {
    if (!item.yearsOfExperience || item.yearsOfExperience <= 0) return null;
    return `${item.yearsOfExperience} años de experiencia`;
  }

  showEmptyState(): boolean {
    return (
      !this.loading() &&
      !this.errorMessage() &&
      this.hasSearched() &&
      !this.hasResults()
    );
  }

  showInitialEmptyState(): boolean {
    return (
      !this.loading() &&
      !this.errorMessage() &&
      !this.hasResults() &&
      !this.hasSearched()
    );
  }

  resetAndLoadDefault(): void {
    this.searchControl.setValue('');
    this.specialtyControl.setValue(null);
    this.cityControl.setValue(null);
    this.hasSearched.set(false);
    this.loadInitialProfessionals();
  }

  private loadInitialProfessionals(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.listTitle.set('Médicos con los que has tenido relación');

    this.appointmentsService.getMyRelatedProfessionals(1, 10).subscribe({
      next: (response) => {
        const related = response.items ?? [];
        if (related.length > 0) {
          this.professionals.set(related.map((item) => this.mapRelated(item)));
          this.loading.set(false);
          return;
        }

        this.loadFallbackProfessionals();
      },
      error: () => {
        this.loadFallbackProfessionals();
      },
    });
  }

  private loadFallbackProfessionals(): void {
    this.listTitle.set('Médicos recomendados');
    this.professionalsService.search({ page: 1, pageSize: 10 }).subscribe({
      next: (response: { professionals: ProfessionalSearchResultDto[] }) => {
        this.professionals.set(response.professionals ?? []);
        this.loading.set(false);
      },
      error: (error: ApiError) => {
        this.errorMessage.set(getUserMessage(error));
        this.professionals.set([]);
        this.loading.set(false);
      },
    });
  }

  private mapRelated(
    item: RelatedProfessionalDto,
  ): ProfessionalSearchResultDto {
    return {
      professionalProfileId: item.id,
      slug: item.slug,
      userId: item.id,
      fullName: item.displayName,
      professionalTitle: undefined,
      photoUrl: item.profileImageUrl ?? undefined,
      specialties: (item.specialties ?? []).map((specialty) => ({
        id: specialty.id,
        name: specialty.name,
      })),
      city: item.cityName ?? undefined,
      country: item.countryName ?? undefined,
      yearsOfExperience: item.yearsOfExperience ?? undefined,
      isAvailableForAppointments: item.hasAvailabilityToday ?? true,
    };
  }

  private normalizeGuid(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return guidRegex.test(value) ? value : undefined;
  }

  private setupDebounce(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.searchProfessionals());

    this.specialtyControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.searchProfessionals());

    this.cityControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.searchProfessionals());
  }

  private loadCatalogs(): void {
    this.catalogService.getSpecialties().subscribe({
      next: (items: SpecialtyDto[]) => {
        this.specialties.set(
          (items ?? []).map((item) => ({
            id: item.id,
            name: item.name,
          })),
        );
      },
      error: () => {
        this.specialties.set([]);
      },
    });

    this.publicApi.getMetadata().subscribe({
      next: (metadata) => {
        this.cities.set(metadata.cities ?? []);

        const categories = metadata.categories ?? [];
        if (categories.length > 0) {
          const specialtyMap = new Map(
            this.specialties().map((item) => [
              item.name.trim().toLowerCase(),
              item,
            ]),
          );

          for (const category of categories) {
            const key = category.name.trim().toLowerCase();
            const existing = specialtyMap.get(key);
            if (existing) {
              specialtyMap.set(key, {
                ...existing,
                slug: category.slug,
              });
            }
          }

          this.specialties.set(Array.from(specialtyMap.values()));
        }
      },
      error: () => {
        this.cities.set([]);
      },
    });
  }
}
