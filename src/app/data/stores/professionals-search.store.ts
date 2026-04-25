import { computed, inject, Injectable, signal } from '@angular/core';
import type { ProblemDetails } from '@core/models';
import { ProfessionalsPublicApi } from '@data/api/professionals-public.api';
import type {
  ProfessionalPublicProfile,
  SearchProfessionalsFilters,
} from '@data/models/availability.models';
import { ToastService } from '@shared/services';
import { catchError, finalize, of, tap } from 'rxjs';

/**
 * Professionals Search Store
 *
 * Signal-based state management para búsqueda de profesionales (paciente).
 */
@Injectable({
  providedIn: 'root',
})
export class ProfessionalsSearchStore {
  private readonly professionalsApi = inject(ProfessionalsPublicApi);
  private readonly toastService = inject(ToastService);

  // State signals
  private readonly _professionals = signal<ProfessionalPublicProfile[]>([]);
  private readonly _selectedProfessional =
    signal<ProfessionalPublicProfile | null>(null);
  private readonly _filters = signal<SearchProfessionalsFilters>({
    page: 1,
    pageSize: 12,
  });
  private readonly _total = signal<number>(0);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _lastError = signal<ProblemDetails | null>(null);

  // Public readonly signals
  readonly professionals = this._professionals.asReadonly();
  readonly selectedProfessional = this._selectedProfessional.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly total = this._total.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly lastError = this._lastError.asReadonly();

  // Computed signals
  readonly totalPages = computed(() => {
    const total = this._total();
    const pageSize = this._filters().pageSize || 12;
    return Math.ceil(total / pageSize);
  });

  readonly hasProfessionals = computed(() => this._professionals().length > 0);

  /**
   * Search professionals with current filters
   */
  searchProfessionals(): void {
    this._isLoading.set(true);
    this._lastError.set(null);

    this.professionalsApi
      .searchProfessionals(this._filters())
      .pipe(
        tap((response) => {
          this._professionals.set(response.items);
          this._total.set(response.total);
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);
          this._professionals.set([]);
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Update filters and search
   */
  setFilters(filters: Partial<SearchProfessionalsFilters>): void {
    this._filters.update((current) => ({
      ...current,
      ...filters,
      page: filters.page ?? 1, // Reset to page 1 when filters change
    }));
    this.searchProfessionals();
  }

  /**
   * Change page
   */
  setPage(page: number): void {
    this._filters.update((current) => ({ ...current, page }));
    this.searchProfessionals();
  }

  /**
   * Clear filters and search
   */
  clearFilters(): void {
    this._filters.set({ page: 1, pageSize: 12 });
    this.searchProfessionals();
  }

  /**
   * Load professional by slug
   */
  loadProfessionalBySlug(slug: string): void {
    this._isLoading.set(true);
    this._lastError.set(null);

    this.professionalsApi
      .getProfessionalBySlug(slug)
      .pipe(
        tap((professional) => {
          this._selectedProfessional.set(professional);
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);
          this._selectedProfessional.set(null);
          this.toastService.error(
            problemDetails.title || 'Error al cargar el profesional',
          );
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Clear selected professional
   */
  clearSelectedProfessional(): void {
    this._selectedProfessional.set(null);
  }

  /**
   * Clear last error
   */
  clearError(): void {
    this._lastError.set(null);
  }
}
