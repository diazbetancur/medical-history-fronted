import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  AppliedFilters,
  MetadataResponse,
  PublicApi,
  SearchProfessional,
} from '@data/api';
import { SeoService } from '@shared/services';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { ProfessionalSearchResponseDto } from '../../../../public/models/professional-search.dto';
import { SpecialtyDto } from '../../../../public/models/specialty.dto';
import { PublicCatalogService } from '../../../../public/services/public-catalog.service';
import { PublicProfessionalsService } from '../../../../public/services/public-professionals.service';
import { PublicHeaderComponent } from '../../components/public-header.component';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [
    PublicHeaderComponent,
    RouterLink,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './search.page.html',
  styleUrl: './search.page.scss',
})
export class SearchPageComponent implements OnInit, OnDestroy {
  private readonly publicApi = inject(PublicApi);
  private readonly catalogService = inject(PublicCatalogService);
  private readonly professionalsService = inject(PublicProfessionalsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);

  private readonly destroy$ = new Subject<void>();
  private readonly pageSize = 10;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly specialtyControl = new FormControl<string | null>(null);
  readonly cityControl = new FormControl<string | null>(null);

  readonly metadata = signal<MetadataResponse | null>(null);
  readonly specialties = signal<SpecialtyDto[]>([]);
  readonly professionals = signal<SearchProfessional[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly pagination = signal<{
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  } | null>(null);
  readonly appliedFilters = signal<AppliedFilters | null>(null);
  readonly suggestions = signal<string[]>([]);

  readonly cities = computed(() => this.metadata()?.cities ?? []);
  readonly hasResults = computed(() => this.professionals().length > 0);

  ngOnInit(): void {
    this.loadMetadata();
    this.loadSpecialties();
    this.setupSuggest();
    this.setupFilterListeners();

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.searchControl.setValue(params['q'] || '', { emitEvent: false });
        const specialtyId = this.normalizeGuid(params['specialtyId']);
        const cityId = this.normalizeGuid(params['cityId']);

        this.specialtyControl.setValue(specialtyId ?? null, {
          emitEvent: false,
        });
        this.cityControl.setValue(cityId ?? null, {
          emitEvent: false,
        });

        this.search(
          params['q'] || undefined,
          specialtyId,
          cityId,
          params['page'] ? Number(params['page']) : 1,
        );
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMetadata(): void {
    this.publicApi.getMetadata().subscribe({
      next: (metadata) => this.metadata.set(metadata),
      error: () =>
        this.metadata.set({ countries: [], cities: [], categories: [] }),
    });
  }

  private loadSpecialties(): void {
    this.catalogService.getSpecialties().subscribe({
      next: (specialties: SpecialtyDto[]) =>
        this.specialties.set(specialties ?? []),
      error: () => this.specialties.set([]),
    });
  }

  private setupSuggest(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          const value = query.trim();
          if (value.length < 3) {
            return of([] as string[]);
          }

          return this.publicApi.suggest(value).pipe(
            map((response) => {
              const names = [
                ...response.professionals.map((item) => item.businessName),
                ...response.services.map((item) => item.name),
                ...response.categories.map((item) => item.name),
              ];
              return [...new Set(names)].slice(0, 8);
            }),
            catchError(() => of([] as string[])),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((items) => this.suggestions.set(items));
  }

  private setupFilterListeners(): void {
    this.specialtyControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.searchWithCurrentFilters(1));

    this.cityControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.searchWithCurrentFilters(1));
  }

  private search(
    q?: string,
    specialtyId?: string,
    cityId?: string,
    page = 1,
  ): void {
    this.loading.set(true);
    this.error.set(null);

    this.professionalsService
      .search({
        q,
        specialtyId,
        cityId,
        page,
        pageSize: this.pageSize,
      })
      .pipe(
        tap((response: ProfessionalSearchResponseDto) => {
          this.professionals.set(
            (response.professionals ?? []).map((item) => ({
              id: item.professionalProfileId,
              slug: item.slug,
              businessName: item.fullName,
              profileImageUrl: item.photoUrl,
              specialties: (item.specialties ?? []).map((specialty) => ({
                id: specialty.id,
                name: specialty.name,
                isPrimary: false,
              })),
              categoryName: '',
              categorySlug: '',
              cityName: item.city ?? '',
              citySlug: '',
              isVerified: false,
              isFeatured: false,
            })),
          );
          this.pagination.set({
            currentPage: response.page,
            pageSize: response.pageSize,
            totalItems: response.total,
            totalPages: response.totalPages,
          });
          this.appliedFilters.set({
            category: specialtyId ?? null,
            city: cityId ?? null,
            q: q ?? null,
          });
          this.seoService.setTitle('Buscar Médicos | MediTigo');
        }),
        catchError((error) => {
          this.error.set(
            error?.error?.title || 'No se pudo cargar la búsqueda',
          );
          this.professionals.set([]);
          this.pagination.set(null);
          return of(null);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.loading.set(false));
  }

  private searchWithCurrentFilters(page = 1): void {
    const q = this.searchControl.value.trim();
    const specialtyId = this.normalizeGuid(this.specialtyControl.value);
    const cityId = this.normalizeGuid(this.cityControl.value);

    this.router.navigate(['/search'], {
      queryParams: {
        q: q || null,
        specialtyId: specialtyId || null,
        cityId: cityId || null,
        page,
      },
    });
  }

  private normalizeGuid(value: string | null | undefined): string | undefined {
    if (!value) return undefined;
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return guidRegex.test(value) ? value : undefined;
  }

  onSearchClick(): void {
    this.searchWithCurrentFilters(1);
  }

  onPageChange(event: PageEvent): void {
    this.searchWithCurrentFilters(event.pageIndex + 1);
  }

  selectSuggestion(value: string): void {
    this.searchControl.setValue(value, { emitEvent: false });
    this.searchWithCurrentFilters(1);
  }

  goToProfile(professionalId: string): void {
    this.router.navigate(['/pro', professionalId]);
  }

  getSpecialtyNames(doctor: SearchProfessional): string[] {
    return (doctor.specialties ?? []).map((item) => item.name);
  }

  getVisibleSpecialtyNames(doctor: SearchProfessional): string[] {
    return this.getSpecialtyNames(doctor).slice(0, 3);
  }

  getHiddenSpecialtiesCount(doctor: SearchProfessional): number {
    const count = this.getSpecialtyNames(doctor).length - 3;
    return count > 0 ? count : 0;
  }

  reload(): void {
    const page = this.pagination()?.currentPage ?? 1;
    this.searchWithCurrentFilters(page);
  }
}
