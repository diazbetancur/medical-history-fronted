import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { PublicApi, SearchPageResponse, SearchParams } from '@data/api';

interface StoreState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

function createInitialState<T>(): StoreState<T> {
  return {
    data: null,
    loading: false,
    error: null,
    lastFetch: null,
  };
}

interface SearchStoreState extends StoreState<SearchPageResponse> {
  currentParams: SearchParams | null;
}

/**
 * Store for Search page data using signals.
 * Handles loading, caching by query params, and error states.
 * Uses real API via PublicApi service.
 */
@Injectable({ providedIn: 'root' })
export class SearchStore {
  private readonly publicApi = inject(PublicApi);

  // Private state signal
  private readonly _state = signal<SearchStoreState>({
    ...createInitialState<SearchPageResponse>(),
    currentParams: null,
  });

  // Cache TTL in milliseconds (2 minutes for search results)
  private readonly CACHE_TTL = 2 * 60 * 1000;

  // Public computed signals (read-only)
  readonly state = this._state.asReadonly();
  readonly data = computed(() => this._state().data);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly professionals = computed(
    () => this._state().data?.professionals ?? []
  );
  readonly pagination = computed(() => this._state().data?.pagination ?? null);
  readonly filters = computed(() => this._state().data?.filters ?? null);
  readonly appliedFilters = computed(
    () => this._state().data?.appliedFilters ?? null
  );
  readonly seo = computed(() => this._state().data?.seo ?? null);
  readonly currentParams = computed(() => this._state().currentParams);
  readonly hasResults = computed(() => this.professionals().length > 0);
  readonly isEmpty = computed(
    () => !this.loading() && !this.hasResults() && !this.error()
  );

  /**
   * Check if cache is valid for given params
   */
  private isCacheValid(params: SearchParams): boolean {
    const state = this._state();
    if (!state.lastFetch || !state.data) return false;

    // Check if params match
    const currentParams = state.currentParams;
    if (!currentParams) return false;

    const paramsMatch =
      currentParams.city === params.city &&
      currentParams.category === params.category &&
      currentParams.q === params.q &&
      currentParams.country === params.country &&
      currentParams.page === params.page &&
      currentParams.pageSize === params.pageSize;

    if (!paramsMatch) return false;

    // Check TTL
    return Date.now() - state.lastFetch < this.CACHE_TTL;
  }

  /**
   * Load search results.
   * Uses cache if params match and cache is valid.
   */
  load(
    params: SearchParams = {},
    forceRefresh = false
  ): Observable<SearchPageResponse> {
    // Return cached data if valid
    if (!forceRefresh && this.isCacheValid(params)) {
      return of(this._state().data!);
    }

    // Set loading state
    this._state.update((s) => ({
      ...s,
      loading: true,
      error: null,
      currentParams: params,
    }));

    return this.publicApi.getSearchPage(params).pipe(
      tap((response) => {
        this._state.set({
          data: response,
          loading: false,
          error: null,
          lastFetch: Date.now(),
          currentParams: params,
        });
      }),
      catchError((err) => {
        const errorMessage =
          err?.error?.detail ||
          err?.error?.message ||
          err?.message ||
          'Error al buscar profesionales';
        this._state.update((s) => ({
          ...s,
          loading: false,
          error: errorMessage,
        }));
        throw err;
      })
    );
  }

  /**
   * Load next page
   */
  loadNextPage(): Observable<SearchPageResponse> | null {
    const pagination = this.pagination();
    const currentParams = this.currentParams();

    if (!pagination || !currentParams) return null;
    if (!pagination.hasNext) return null;

    return this.load({
      ...currentParams,
      page: pagination.currentPage + 1,
    });
  }

  /**
   * Load previous page
   */
  loadPreviousPage(): Observable<SearchPageResponse> | null {
    const pagination = this.pagination();
    const currentParams = this.currentParams();

    if (!pagination || !currentParams) return null;
    if (!pagination.hasPrevious) return null;

    return this.load({
      ...currentParams,
      page: pagination.currentPage - 1,
    });
  }

  /**
   * Clear cached data
   */
  clearCache(): void {
    this._state.set({
      ...createInitialState<SearchPageResponse>(),
      currentParams: null,
    });
  }
}
