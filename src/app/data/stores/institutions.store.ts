import { computed, inject, Injectable, signal } from '@angular/core';
import type { ProblemDetails } from '@core/models';
import { InstitutionsApi } from '@data/api/institutions.api';
import type {
  CreateInstitutionDto,
  InstitutionDto,
  InstitutionFilters,
  UpdateInstitutionDto,
} from '@data/models/institution.models';
import { ToastService } from '@shared/services';
import { catchError, finalize, of, tap } from 'rxjs';

/**
 * Institutions Store
 *
 * Signal-based state management para el módulo de instituciones.
 */
@Injectable({
  providedIn: 'root',
})
export class InstitutionsStore {
  private readonly institutionsApi = inject(InstitutionsApi);
  private readonly toastService = inject(ToastService);

  // State signals
  private readonly _institutions = signal<InstitutionDto[]>([]);
  private readonly _selectedInstitution = signal<InstitutionDto | null>(null);
  private readonly _filters = signal<InstitutionFilters>({
    page: 1,
    pageSize: 10,
  });
  private readonly _total = signal<number>(0);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _lastError = signal<ProblemDetails | null>(null);

  // Public readonly signals
  readonly institutions = this._institutions.asReadonly();
  readonly selectedInstitution = this._selectedInstitution.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly total = this._total.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly lastError = this._lastError.asReadonly();

  // Computed signals
  readonly totalPages = computed(() => {
    const total = this._total();
    const pageSize = this._filters().pageSize || 10;
    return Math.ceil(total / pageSize);
  });

  readonly hasInstitutions = computed(() => this._institutions().length > 0);

  constructor() {
    // Auto-load institutions on init
    this.loadInstitutions();
  }

  /**
   * Load institutions with current filters
   */
  loadInstitutions(): void {
    this._isLoading.set(true);
    this._lastError.set(null);

    this.institutionsApi
      .getInstitutions(this._filters())
      .pipe(
        tap((response) => {
          this._institutions.set(response.items);
          this._total.set(response.total);
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);
          this._institutions.set([]);
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Update filters and reload
   */
  setFilters(filters: Partial<InstitutionFilters>): void {
    this._filters.update((current) => ({
      ...current,
      ...filters,
      page: filters.page ?? 1, // Reset to page 1 when filters change (except explicit page change)
    }));
    this.loadInstitutions();
  }

  /**
   * Change page
   */
  setPage(page: number): void {
    this._filters.update((current) => ({ ...current, page }));
    this.loadInstitutions();
  }

  /**
   * Clear all filters and reload
   */
  clearFilters(): void {
    this._filters.set({ page: 1, pageSize: 10 });
    this.loadInstitutions();
  }

  /**
   * Load a single institution by ID
   */
  loadInstitutionById(id: string): void {
    this._isLoading.set(true);
    this._lastError.set(null);

    this.institutionsApi
      .getInstitutionById(id)
      .pipe(
        tap((institution) => {
          this._selectedInstitution.set(institution);
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);
          this._selectedInstitution.set(null);
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Create a new institution
   */
  createInstitution(dto: CreateInstitutionDto): void {
    this._isLoading.set(true);
    this._lastError.set(null);

    this.institutionsApi
      .createInstitution(dto)
      .pipe(
        tap((institution) => {
          this.toastService.success(
            `Institución "${institution.name}" creada exitosamente`,
          );
          this.loadInstitutions(); // Reload list
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);

          // Manejo especial para códigos duplicados
          if (problemDetails.errorCode === 'INSTITUTION_ALREADY_EXISTS') {
            this.toastService.error(
              `Ya existe una institución con el código "${dto.code}". Por favor, usa un código diferente.`,
            );
          } else {
            this.toastService.error(
              problemDetails.title || 'Error al crear la institución',
            );
          }

          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Update an existing institution
   */
  updateInstitution(id: string, dto: UpdateInstitutionDto): void {
    this._isLoading.set(true);
    this._lastError.set(null);

    this.institutionsApi
      .updateInstitution(id, dto)
      .pipe(
        tap((institution) => {
          this.toastService.success(
            `Institución "${institution.name}" actualizada exitosamente`,
          );
          this.loadInstitutions(); // Reload list
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);

          // Manejo especial para códigos duplicados
          if (problemDetails.errorCode === 'INSTITUTION_ALREADY_EXISTS') {
            this.toastService.error(
              `Ya existe una institución con el código "${dto.code}". Por favor, usa un código diferente.`,
            );
          } else {
            this.toastService.error(
              problemDetails.title || 'Error al actualizar la institución',
            );
          }

          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Delete an institution
   */
  deleteInstitution(id: string, name: string): void {
    this._isLoading.set(true);
    this._lastError.set(null);

    this.institutionsApi
      .deleteInstitution(id)
      .pipe(
        tap(() => {
          this.toastService.success(
            `Institución "${name}" eliminada exitosamente`,
          );
          this.loadInstitutions(); // Reload list
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);
          this.toastService.error(
            problemDetails.title || 'Error al eliminar la institución',
          );
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Clear selected institution
   */
  clearSelectedInstitution(): void {
    this._selectedInstitution.set(null);
  }

  /**
   * Clear last error
   */
  clearError(): void {
    this._lastError.set(null);
  }
}
