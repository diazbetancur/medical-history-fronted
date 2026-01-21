import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { ProfilePageResponse, PublicApi } from '@data/api';

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

interface ProfileStoreState extends StoreState<ProfilePageResponse> {
  currentSlug: string | null;
}

// In-memory cache for multiple profiles
const profileCache = new Map<
  string,
  { data: ProfilePageResponse; timestamp: number }
>();

/**
 * Store for Profile page data using signals.
 * Handles loading, caching by slug, and error states.
 * Uses real API via PublicApi service.
 */
@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly publicApi = inject(PublicApi);

  // Private state signal
  private readonly _state = signal<ProfileStoreState>({
    ...createInitialState<ProfilePageResponse>(),
    currentSlug: null,
  });

  // Cache TTL in milliseconds (10 minutes for profile data)
  private readonly CACHE_TTL = 10 * 60 * 1000;

  // Public computed signals (read-only)
  readonly state = this._state.asReadonly();
  readonly data = computed(() => this._state().data);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly profile = computed(() => this._state().data?.profile ?? null);
  readonly seo = computed(() => this._state().data?.seo ?? null);
  readonly services = computed(() => this._state().data?.services ?? []);
  readonly relatedProfessionals = computed(
    () => this._state().data?.relatedProfessionals ?? []
  );
  readonly currentSlug = computed(() => this._state().currentSlug);

  /**
   * Check if cache is valid for given slug
   */
  private isCacheValid(slug: string): boolean {
    const cached = profileCache.get(slug);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_TTL;
  }

  /**
   * Get cached data for slug
   */
  private getCached(slug: string): ProfilePageResponse | null {
    const cached = profileCache.get(slug);
    if (!cached || !this.isCacheValid(slug)) return null;
    return cached.data;
  }

  /**
   * Set cache for slug
   */
  private setCache(slug: string, data: ProfilePageResponse): void {
    profileCache.set(slug, { data, timestamp: Date.now() });

    // Limit cache size (keep last 20 profiles)
    if (profileCache.size > 20) {
      const oldest = [...profileCache.entries()].sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0];
      profileCache.delete(oldest[0]);
    }
  }

  /**
   * Load profile data by slug.
   * Uses cache if available and valid.
   */
  load(slug: string, forceRefresh = false): Observable<ProfilePageResponse> {
    // Return cached data if valid
    if (!forceRefresh) {
      const cached = this.getCached(slug);
      if (cached) {
        this._state.set({
          data: cached,
          loading: false,
          error: null,
          lastFetch: Date.now(),
          currentSlug: slug,
        });
        return of(cached);
      }
    }

    // Set loading state
    this._state.update((s) => ({
      ...s,
      loading: true,
      error: null,
      currentSlug: slug,
    }));

    return this.publicApi.getProfilePage(slug).pipe(
      tap((response) => {
        this.setCache(slug, response);
        this._state.set({
          data: response,
          loading: false,
          error: null,
          lastFetch: Date.now(),
          currentSlug: slug,
        });
      }),
      catchError((err) => {
        const errorMessage =
          err?.error?.detail ||
          err?.error?.message ||
          err?.message ||
          'Error al cargar el perfil';
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
   * Clear current profile (but keep cache)
   */
  reset(): void {
    this._state.set({
      ...createInitialState<ProfilePageResponse>(),
      currentSlug: null,
    });
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    profileCache.clear();
    this.reset();
  }
}
