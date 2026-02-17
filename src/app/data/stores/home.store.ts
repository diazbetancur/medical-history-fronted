import { Injectable, computed, inject, signal } from '@angular/core';
import { HomePageResponse, PublicApi } from '@data/api';
import { Observable, catchError, of, tap } from 'rxjs';

/**
 * Store state interface
 */
export interface StoreState<T> {
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

/**
 * Store for Home page data using signals.
 * Handles loading, caching, and error states.
 * Uses real API via PublicApi service.
 */
@Injectable({ providedIn: 'root' })
export class HomeStore {
  private readonly publicApi = inject(PublicApi);

  // Private state signal
  private readonly _state =
    signal<StoreState<HomePageResponse>>(createInitialState());

  // Cache TTL in milliseconds (5 minutes)
  private readonly CACHE_TTL = 5 * 60 * 1000;

  // Public computed signals (read-only)
  readonly state = this._state.asReadonly();
  readonly data = computed(() => this._state().data);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly featuredCategories = computed(
    () =>
      this._state().data?.featuredSpecialties ??
      this._state().data?.featuredCategories ??
      [],
  );
  readonly featuredProfessionals = computed(
    () => this._state().data?.featuredProfessionals ?? [],
  );
  readonly popularCities = computed(
    () => this._state().data?.popularCities ?? [],
  );
  readonly totals = computed(() => this._state().data?.totals ?? null);
  readonly seo = computed(() => this._state().data?.seo ?? null);

  /**
   * Check if cache is still valid
   */
  private isCacheValid(): boolean {
    const lastFetch = this._state().lastFetch;
    if (!lastFetch) return false;
    return Date.now() - lastFetch < this.CACHE_TTL;
  }

  /**
   * Load home page data.
   * Uses cache if available and valid.
   * Returns Observable for SSR compatibility (TransferState).
   */
  load(forceRefresh = false): Observable<HomePageResponse> {
    // Return cached data if valid
    if (!forceRefresh && this.isCacheValid() && this._state().data) {
      return of(this._state().data!);
    }

    // Set loading state
    this._state.update((s) => ({
      ...s,
      loading: true,
      error: null,
    }));

    return this.publicApi.getHomePage().pipe(
      tap((response) => {
        this._state.set({
          data: response,
          loading: false,
          error: null,
          lastFetch: Date.now(),
        });
      }),
      catchError((err) => {
        const errorMessage =
          err?.error?.detail ||
          err?.error?.message ||
          err?.message ||
          'Error al cargar la página de inicio';
        this._state.update((s) => ({
          ...s,
          loading: false,
          error: errorMessage,
        }));
        throw err;
      }),
    );
  }

  /**
   * Clear cached data
   */
  clearCache(): void {
    this._state.set(createInitialState());
  }
}
