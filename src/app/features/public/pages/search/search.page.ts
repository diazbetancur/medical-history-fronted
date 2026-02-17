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
  SearchPageResponse,
  SearchParams,
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);

  private readonly destroy$ = new Subject<void>();
  private readonly pageSize = 10;

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly specialtyControl = new FormControl<string | null>(null);
  readonly cityControl = new FormControl<string | null>(null);

  readonly metadata = signal<MetadataResponse | null>(null);
  readonly professionals = signal<SearchProfessional[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly pagination = signal<SearchPageResponse['pagination'] | null>(null);
  readonly appliedFilters = signal<AppliedFilters | null>(null);
  readonly suggestions = signal<string[]>([]);

  readonly specialties = computed(() => this.metadata()?.categories ?? []);
  readonly cities = computed(() => this.metadata()?.cities ?? []);
  readonly hasResults = computed(() => this.professionals().length > 0);

  ngOnInit(): void {
    this.loadMetadata();
    this.setupSuggest();
    this.setupFilterListeners();

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.searchControl.setValue(params['q'] || '', { emitEvent: false });
        this.specialtyControl.setValue(params['category'] || null, {
          emitEvent: false,
        });
        this.cityControl.setValue(params['city'] || null, {
          emitEvent: false,
        });

        this.search({
          q: params['q'] || undefined,
          category: params['category'] || undefined,
          city: params['city'] || undefined,
          page: params['page'] ? Number(params['page']) : 1,
          pageSize: this.pageSize,
        });
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

  private search(params: SearchParams): void {
    this.loading.set(true);
    this.error.set(null);

    this.publicApi
      .getSearchPage(params)
      .pipe(
        tap((response) => {
          this.professionals.set(response.professionals ?? []);
          this.pagination.set(response.pagination ?? null);
          this.appliedFilters.set(response.appliedFilters ?? null);

          if (response.seo) {
            this.seoService.setSeo(response.seo);
          }
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
    const category = this.specialtyControl.value;
    const city = this.cityControl.value;

    this.router.navigate(['/search'], {
      queryParams: {
        q: q || null,
        category: category || null,
        city: city || null,
        page,
      },
    });
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

  goToProfile(slug: string): void {
    this.router.navigate(['/pro', slug]);
  }

  reload(): void {
    const page = this.pagination()?.currentPage ?? 1;
    this.searchWithCurrentFilters(page);
  }
}
