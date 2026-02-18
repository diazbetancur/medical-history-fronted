import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { AdminApi } from '../api/admin.api';
import type {
  AdminProfessionalDetail,
  AdminProfessionalListItem,
  AdminProfessionalsParams,
  ModerateProfilePayload,
  ModerateProfileResponse,
  PaginationMeta,
} from '../api/api-models';

// =============================================================================
// State
// =============================================================================

export type ProfessionalStatusFilter =
  | 'pending'
  | 'active'
  | 'disabled'
  | 'all';

interface AdminProfessionalsState {
  // Filter/query state
  statusFilter: ProfessionalStatusFilter;
  query: string;
  page: number;
  pageSize: number;

  // Loading states
  loading: boolean;
  loadingDetail: boolean;
  saving: boolean;

  // Error state
  error: string | null;

  // Data
  professionals: AdminProfessionalListItem[];
  pagination: PaginationMeta;
  selectedProfessional: AdminProfessionalDetail | null;
}

const DEFAULT_PAGE_SIZE = 20;

const initialPagination: PaginationMeta = {
  currentPage: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
  hasPrevious: false,
  hasNext: false,
};

const initialState: AdminProfessionalsState = {
  statusFilter: 'pending',
  query: '',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  loading: false,
  loadingDetail: false,
  saving: false,
  error: null,
  professionals: [],
  pagination: initialPagination,
  selectedProfessional: null,
};

// =============================================================================
// Store
// =============================================================================

/**
 * Admin Professionals Store
 *
 * Manages state for the /admin/professionals page.
 * Handles listing, filtering, detail view, and moderation of professional profiles.
 *
 * Status filters:
 * - pending: isActive=true AND isVerified=false (awaiting verification)
 * - active: isActive=true AND isVerified=true
 * - disabled: isActive=false
 * - all: no filter
 */
@Injectable({ providedIn: 'root' })
export class AdminProfessionalsStore {
  private readonly adminApi = inject(AdminApi);
  private readonly destroyRef = inject(DestroyRef);

  // ---------------------------------------------------------------------------
  // Private State
  // ---------------------------------------------------------------------------

  private readonly _state = signal<AdminProfessionalsState>(initialState);
  private readonly searchSubject = new Subject<string>();

  // ---------------------------------------------------------------------------
  // Public Selectors
  // ---------------------------------------------------------------------------

  readonly statusFilter = computed(() => this._state().statusFilter);
  readonly query = computed(() => this._state().query);
  readonly page = computed(() => this._state().page);
  readonly pageSize = computed(() => this._state().pageSize);

  readonly loading = computed(() => this._state().loading);
  readonly loadingDetail = computed(() => this._state().loadingDetail);
  readonly saving = computed(() => this._state().saving);
  readonly error = computed(() => this._state().error);

  readonly professionals = computed(() => this._state().professionals);
  readonly pagination = computed(() => this._state().pagination);
  readonly selectedProfessional = computed(
    () => this._state().selectedProfessional,
  );

  readonly totalItems = computed(() => this._state().pagination.totalItems);
  readonly isEmpty = computed(
    () => !this._state().loading && this._state().professionals.length === 0,
  );

  // Count helpers for tab badges
  readonly pendingCount = computed(() =>
    this._state().statusFilter === 'pending'
      ? this._state().pagination.totalItems
      : 0,
  );

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------

  constructor() {
    this.setupSearchDebounce();
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        tap((query) => {
          this.updateState({ query, page: 1 });
        }),
        switchMap(() => this.executeLoad()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------

  load(): void {
    this.executeLoad().subscribe();
  }

  private executeLoad() {
    this.updateState({ loading: true, error: null });

    const { statusFilter, query, page, pageSize } = this._state();

    const params: AdminProfessionalsParams = {
      status: statusFilter,
      page,
      pageSize,
      q: query || undefined,
    };

    return this.adminApi.getProfessionals(params).pipe(
      tap((response) => {
        this.updateState({
          professionals: response.data,
          pagination: response.pagination,
          loading: false,
        });
      }),
      catchError((err) => {
        const message =
          err.status === 403
            ? 'No tienes permisos para ver profesionales'
            : 'Error al cargar profesionales';
        this.updateState({ error: message, loading: false, professionals: [] });
        return of(null);
      }),
      finalize(() => {
        if (this._state().loading) this.updateState({ loading: false });
      }),
      takeUntilDestroyed(this.destroyRef),
    );
  }

  // ---------------------------------------------------------------------------
  // Filters / Pagination
  // ---------------------------------------------------------------------------

  setStatusFilter(status: ProfessionalStatusFilter): void {
    if (status === this._state().statusFilter) return;
    this.updateState({
      statusFilter: status,
      page: 1,
      selectedProfessional: null,
    });
    this.load();
  }

  setQuery(query: string): void {
    this.searchSubject.next(query);
  }

  setPage(page: number): void {
    if (page < 1 || page === this._state().page) return;
    this.updateState({ page });
    this.load();
  }

  setPageSize(size: number): void {
    if (size < 1 || size === this._state().pageSize) return;
    this.updateState({ pageSize: size, page: 1 });
    this.load();
  }

  // ---------------------------------------------------------------------------
  // Detail
  // ---------------------------------------------------------------------------

  selectProfessional(id: string): void {
    if (this._state().selectedProfessional?.id === id) return;

    this.updateState({ loadingDetail: true, selectedProfessional: null });

    this.adminApi
      .getProfessional(id)
      .pipe(
        tap((detail) => {
          this.updateState({
            selectedProfessional: detail,
            loadingDetail: false,
          });
        }),
        catchError(() => {
          this.updateState({ loadingDetail: false });
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  clearSelectedProfessional(): void {
    this.updateState({ selectedProfessional: null });
  }

  // ---------------------------------------------------------------------------
  // Moderation Actions
  // ---------------------------------------------------------------------------

  /**
   * Verify (approve) a professional profile.
   * Sets isVerified=true, isActive=true.
   */
  verifyProfessional(id: string, adminNotes?: string) {
    const payload: ModerateProfilePayload = {
      isVerified: true,
      isActive: true,
      adminNotes,
    };
    return this._moderate(id, payload);
  }

  /**
   * Disable a professional profile (soft ban / reject).
   * Sets isActive=false.
   */
  disableProfessional(id: string, adminNotes?: string) {
    const payload: ModerateProfilePayload = {
      isActive: false,
      adminNotes,
    };
    return this._moderate(id, payload);
  }

  /**
   * Re-enable a disabled professional.
   */
  enableProfessional(id: string) {
    const payload: ModerateProfilePayload = { isActive: true };
    return this._moderate(id, payload);
  }

  /**
   * Toggle featured status.
   */
  featureProfessional(id: string, isFeatured: boolean, adminNotes?: string) {
    const payload: ModerateProfilePayload = { isFeatured, adminNotes };
    return this._moderate(id, payload);
  }

  /**
   * Update admin notes only.
   */
  updateAdminNotes(id: string, adminNotes: string) {
    return this._moderate(id, { adminNotes });
  }

  private _moderate(id: string, payload: ModerateProfilePayload) {
    this.updateState({ saving: true });

    return this.adminApi.moderateProfile(id, payload).pipe(
      tap((response: ModerateProfileResponse) => {
        // Update professional in the list
        this.updateState({
          saving: false,
          professionals: this._state().professionals.map((p) =>
            p.id === id
              ? {
                  ...p,
                  isActive: response.isActive,
                  isVerified: response.isVerified,
                  isFeatured: response.isFeatured,
                  adminNotes: response.adminNotes,
                  dateUpdated: response.dateUpdated,
                }
              : p,
          ),
        });

        // Update selected professional detail if it's the same
        const sel = this._state().selectedProfessional;
        if (sel?.id === id) {
          this.updateState({
            selectedProfessional: {
              ...sel,
              isActive: response.isActive,
              isVerified: response.isVerified,
              isFeatured: response.isFeatured,
              adminNotes: response.adminNotes,
              dateUpdated: response.dateUpdated,
            },
          });
        }
      }),
      catchError((err) => {
        this.updateState({ saving: false });
        throw err;
      }),
    );
  }

  // ---------------------------------------------------------------------------
  // Misc
  // ---------------------------------------------------------------------------

  clearError(): void {
    this.updateState({ error: null });
  }

  reload(): void {
    this.updateState({ page: 1, selectedProfessional: null });
    this.load();
  }

  // ---------------------------------------------------------------------------
  // Private Helper
  // ---------------------------------------------------------------------------

  private updateState(partial: Partial<AdminProfessionalsState>): void {
    this._state.update((s) => ({ ...s, ...partial }));
  }
}
