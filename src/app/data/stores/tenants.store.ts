import { computed, inject, Injectable, signal } from '@angular/core';
import type { ProblemDetails } from '@core/models';
import { TenantsApi } from '@data/api/tenants.api';
import type {
  CreateTenantDto,
  TenantDto,
  UpdateTenantDto,
} from '@data/models/tenant.models';
import { ToastService } from '@shared/services';
import { catchError, finalize, of, tap } from 'rxjs';

/**
 * Tenants Store
 *
 * Signal-based state management para el módulo de tenants.
 */
@Injectable({
  providedIn: 'root',
})
export class TenantsStore {
  private readonly tenantsApi = inject(TenantsApi);
  private readonly toastService = inject(ToastService);

  // State signals
  private readonly _tenants = signal<TenantDto[]>([]);
  private readonly _selectedTenant = signal<TenantDto | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _lastError = signal<ProblemDetails | null>(null);

  // Public readonly signals
  readonly tenants = this._tenants.asReadonly();
  readonly selectedTenant = this._selectedTenant.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly lastError = this._lastError.asReadonly();

  // Computed signals
  readonly hasTenants = computed(() => this._tenants().length > 0);

  readonly activeTenants = computed(() =>
    this._tenants().filter((t) => t.isActive),
  );

  /**
   * Load all tenants (on-demand — call explicitly from SuperAdmin-only contexts)
   */
  loadTenants(): void {
    this._isLoading.set(true);
    this._lastError.set(null);

    this.tenantsApi
      .getAll()
      .pipe(
        tap((tenants) => {
          this._tenants.set(tenants);
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);
          this._tenants.set([]);
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Load a single tenant by ID
   */
  loadTenantById(id: string): void {
    this._isLoading.set(true);
    this._lastError.set(null);

    this.tenantsApi
      .getById(id)
      .pipe(
        tap((tenant) => {
          this._selectedTenant.set(tenant);
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);
          this._selectedTenant.set(null);
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Create a new tenant
   */
  createTenant(dto: CreateTenantDto): void {
    this._isLoading.set(true);
    this._lastError.set(null);

    this.tenantsApi
      .create(dto)
      .pipe(
        tap((tenant) => {
          this.toastService.success(
            `Tenant "${tenant.name}" creado exitosamente`,
          );
          this.loadTenants(); // Reload list
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);

          // Manejo especial para códigos duplicados
          if (problemDetails.errorCode === 'TENANT_ALREADY_EXISTS') {
            this.toastService.error(
              `Ya existe un tenant con el código "${dto.code}". Por favor, usa un código diferente.`,
            );
          } else {
            this.toastService.error(
              problemDetails.title || 'Error al crear el tenant',
            );
          }

          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Update an existing tenant
   */
  updateTenant(id: string, dto: UpdateTenantDto): void {
    this._isLoading.set(true);
    this._lastError.set(null);

    this.tenantsApi
      .update(id, dto)
      .pipe(
        tap((tenant) => {
          this.toastService.success(
            `Tenant "${tenant.name}" actualizado exitosamente`,
          );
          this.loadTenants(); // Reload list
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);
          this.toastService.error(
            problemDetails.title || 'Error al actualizar el tenant',
          );
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Clear selected tenant
   */
  clearSelectedTenant(): void {
    this._selectedTenant.set(null);
  }

  /**
   * Clear last error
   */
  clearError(): void {
    this._lastError.set(null);
  }
}
