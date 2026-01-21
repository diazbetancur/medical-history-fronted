import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PublicApi, SuggestResponse } from '@data/api';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  of,
  switchMap,
  tap,
} from 'rxjs';

/**
 * Minimum characters required to trigger typeahead
 */
const MIN_QUERY_LENGTH = 3;

/**
 * Debounce time in milliseconds
 */
const DEBOUNCE_MS = 300;

/**
 * Empty response for when we don't want to call the API
 */
const EMPTY_RESPONSE: SuggestResponse = {
  professionals: [],
  categories: [],
  services: [],
};

interface TypeaheadState {
  query: string;
  results: SuggestResponse;
  loading: boolean;
}

const INITIAL_STATE: TypeaheadState = {
  query: '',
  results: EMPTY_RESPONSE,
  loading: false,
};

/**
 * Typeahead Store for search suggestions.
 *
 * Features:
 * - Minimum 3 characters before API call
 * - 300ms debounce
 * - distinctUntilChanged to avoid duplicate requests
 * - switchMap to cancel previous requests
 * - SSR-safe: only runs in browser
 * - Silent 400 error handling (no snackbar)
 */
@Injectable({ providedIn: 'root' })
export class TypeaheadStore {
  private readonly publicApi = inject(PublicApi);
  private readonly platformId = inject(PLATFORM_ID);

  // Private state
  private readonly _state = signal<TypeaheadState>(INITIAL_STATE);

  // Query input subject for reactive pipeline
  private readonly querySubject$ = new Subject<string>();

  // Public computed signals
  readonly query = computed(() => this._state().query);
  readonly results = computed(() => this._state().results);
  readonly loading = computed(() => this._state().loading);
  readonly professionals = computed(() => this._state().results.professionals);
  readonly categories = computed(() => this._state().results.categories);
  readonly services = computed(() => this._state().results.services);
  readonly hasResults = computed(
    () =>
      this.professionals().length > 0 ||
      this.categories().length > 0 ||
      this.services().length > 0,
  );

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  constructor() {
    // Only setup reactive pipeline in browser
    if (this.isBrowser) {
      this.setupTypeaheadPipeline();
    }
  }

  /**
   * Setup the reactive typeahead pipeline with all optimizations
   */
  private setupTypeaheadPipeline(): void {
    this.querySubject$
      .pipe(
        // Trim input
        tap((q) => {
          const trimmed = q.trim();
          this._state.update((s) => ({ ...s, query: trimmed }));
        }),
        // Extract trimmed value for downstream
        distinctUntilChanged(),
        // Debounce to avoid too many requests
        debounceTime(DEBOUNCE_MS),
        // Filter out queries that are too short
        filter((q) => {
          const trimmed = q.trim();
          if (trimmed.length < MIN_QUERY_LENGTH) {
            // Clear results immediately for short queries
            this._state.update((s) => ({
              ...s,
              results: EMPTY_RESPONSE,
              loading: false,
            }));
            return false;
          }
          return true;
        }),
        // Set loading state
        tap(() => {
          this._state.update((s) => ({ ...s, loading: true }));
        }),
        // Cancel previous request and make new one
        switchMap((q) =>
          this.publicApi.suggest(q.trim()).pipe(
            catchError(() => {
              // Silent error handling - return empty results
              // 400 errors from suggest are handled silently
              return of(EMPTY_RESPONSE);
            }),
          ),
        ),
        // Use takeUntilDestroyed for automatic cleanup
        takeUntilDestroyed(),
      )
      .subscribe((results) => {
        this._state.update((s) => ({
          ...s,
          results,
          loading: false,
        }));
      });
  }

  /**
   * Update the search query.
   * This triggers the debounced typeahead pipeline.
   *
   * @param query The search query string
   */
  search(query: string): void {
    // SSR-safe: do nothing on server
    if (!this.isBrowser) {
      return;
    }

    this.querySubject$.next(query);
  }

  /**
   * Clear all results and reset state.
   * Useful when closing the autocomplete panel.
   */
  clear(): void {
    this._state.set(INITIAL_STATE);
  }

  /**
   * Check if query meets minimum length requirement.
   * Useful for UI feedback.
   */
  isQueryTooShort(query: string): boolean {
    return query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH;
  }
}
