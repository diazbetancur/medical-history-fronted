import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ApiError, getUserMessage } from '@core/http/api-error';
import { PublicApi } from '@data/api';
import { City } from '@data/api/api-models';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import {
  getInitials,
  ProfessionalSearchFiltersDto,
  ProfessionalSearchResultDto,
} from '../../../../public/models/professional-search.dto';
import { SpecialtyDto } from '../../../../public/models/specialty.dto';
import { PublicCatalogService } from '../../../../public/services/public-catalog.service';
import { PublicProfessionalsService } from '../../../../public/services/public-professionals.service';

export interface SelectedProfessionalForBooking {
  professionalProfileId: string;
  slug: string;
  fullName: string;
  photoUrl?: string;
  specialty?: string;
}

export interface RequestAppointmentDialogData {
  pageSize?: number;
}

@Component({
  selector: 'app-request-appointment-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './request-appointment-dialog.component.html',
  styleUrl: './request-appointment-dialog.component.scss',
})
export class RequestAppointmentDialogComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly professionalsService = inject(PublicProfessionalsService);
  private readonly catalogService = inject(PublicCatalogService);
  private readonly publicApi = inject(PublicApi);
  private readonly dialogRef = inject(
    MatDialogRef<
      RequestAppointmentDialogComponent,
      SelectedProfessionalForBooking | null
    >,
  );
  readonly data = inject<RequestAppointmentDialogData>(MAT_DIALOG_DATA, {
    optional: true,
  });

  readonly searchControl = new FormControl<string>('');
  readonly specialtyControl = new FormControl<string | null>(null);
  readonly cityControl = new FormControl<string | null>(null);

  readonly loading = signal(false);
  readonly hasSearched = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly specialties = signal<SpecialtyDto[]>([]);
  readonly cities = signal<City[]>([]);
  readonly results = signal<ProfessionalSearchResultDto[]>([]);

  readonly getInitials = getInitials;

  constructor() {
    this.loadCatalogs();
    this.setupDebounce();
    this.loadDefaultResults();
  }

  close(): void {
    this.dialogRef.close(null);
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.loadDefaultResults();
  }

  loadDefaultResults(): void {
    if (this.hasSearched()) {
      return;
    }
    this.searchProfessionals();
  }

  searchProfessionals(): void {
    const filters: ProfessionalSearchFiltersDto = {
      q: this.searchControl.value?.trim() || undefined,
      specialtyId: this.specialtyControl.value || undefined,
      cityId: this.cityControl.value || undefined,
      page: 1,
      pageSize: this.data?.pageSize ?? 12,
    };

    this.loading.set(true);
    this.errorMessage.set(null);
    this.hasSearched.set(true);

    this.professionalsService.search(filters).subscribe({
      next: (response) => {
        this.results.set(response.professionals ?? []);
        this.loading.set(false);
      },
      error: (error: ApiError) => {
        this.errorMessage.set(getUserMessage(error));
        this.results.set([]);
        this.loading.set(false);
      },
    });
  }

  selectProfessional(item: ProfessionalSearchResultDto): void {
    if (item.slug) {
      this.dialogRef.close({
        professionalProfileId: item.professionalProfileId,
        slug: item.slug,
        fullName: item.fullName,
        photoUrl: item.photoUrl,
        specialty: item.specialties[0]?.name,
      });
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.professionalsService
      .search({ q: item.fullName, page: 1, pageSize: 20 })
      .subscribe({
        next: (response) => {
          const resolved = response.professionals.find(
            (prof) => prof.professionalProfileId === item.professionalProfileId,
          );

          if (!resolved?.slug) {
            this.errorMessage.set(
              'No pudimos abrir este médico. Intenta buscarlo por nombre.',
            );
            this.loading.set(false);
            return;
          }

          this.loading.set(false);
          this.dialogRef.close({
            professionalProfileId: resolved.professionalProfileId,
            slug: resolved.slug,
            fullName: resolved.fullName,
            photoUrl: resolved.photoUrl,
            specialty: resolved.specialties[0]?.name,
          });
        },
        error: (error: ApiError) => {
          this.errorMessage.set(getUserMessage(error));
          this.loading.set(false);
        },
      });
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
      next: (items) => this.specialties.set(items),
      error: () => this.specialties.set([]),
    });

    this.publicApi.getMetadata().subscribe({
      next: (metadata) => this.cities.set(metadata.cities ?? []),
      error: () => this.cities.set([]),
    });
  }
}
