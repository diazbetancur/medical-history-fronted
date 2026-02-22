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
import type { AdminUsersSegment } from '../api/admin-users.api';
import { AdminUsersApi } from '../api/admin-users.api';
import type {
  AdminApiError,
  AdminUserDetailDto,
  AdminUserListDto,
  CreateUserDto,
  PaginationInfo,
  UpdateUserDto,
  UpdateUserRolesDto,
} from '../api/admin-users.types';
import { RolesApi, type Role } from '../api/roles.api';

// =============================================================================
// Store State Interface
// =============================================================================

interface AdminUsersState {
  // Query/Filter state
  segment: AdminUsersSegment;
  query: string;
  page: number;
  pageSize: number;

  // Loading states
  loading: boolean;
  loadingDetail: boolean;
  saving: boolean;

  // Error state
  error: AdminApiError | null;

  // Data
  users: AdminUserListDto[];
  pagination: PaginationInfo;
  selectedUser: AdminUserDetailDto | null;

  // Catalog data
  rolesCatalog: Role[];
  loadingRoles: boolean;
}

const DEFAULT_PAGE_SIZE = 10;

const initialPagination: PaginationInfo = {
  currentPage: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
  hasPrevious: false,
  hasNext: false,
};

const initialState: AdminUsersState = {
  segment: 'others',
  query: '',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  loading: false,
  loadingDetail: false,
  saving: false,
  error: null,
  users: [],
  pagination: initialPagination,
  selectedUser: null,
  rolesCatalog: [],
  loadingRoles: false,
};

/**
 * Admin Users Store
 *
 * Manages state for the /admin/users page using Angular Signals.
 * Provides user CRUD operations with pagination, search, and role management.
 *
 * @example Console Testing
 * ```typescript
 * // Get store instance
 * const store = inject(AdminUsersStore);
 *
 * // Load users
 * store.loadUsers();
 *
 * // Search with debounce
 * store.setQuery('john');
 *
 * // Paginate
 * store.setPage(2);
 * store.setPageSize(25);
 *
 * // Select user for detail
 * store.selectUser('user-uuid-123');
 *
 * // Create user
 * store.createUser({
 *   userName: 'newuser',
 *   email: 'new@example.com',
 *   password: 'Pass123!',
 *   confirmPassword: 'Pass123!',
 *   roles: ['User']
 * });
 *
 * // Update user
 * store.updateUser('user-uuid-123', { userName: 'updated' });
 *
 * // Update roles
 * store.updateUserRoles('user-uuid-123', { rolesToAdd: ['Admin'], rolesToRemove: ['User'] });
 *
 * // Delete user
 * store.deleteUser('user-uuid-123');
 *
 * // Read state
 * console.log(store.users());
 * console.log(store.pagination());
 * console.log(store.selectedUser());
 * console.log(store.roleNames());
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AdminUsersStore {
  private readonly destroyRef = inject(DestroyRef);
  private readonly usersApi = inject(AdminUsersApi);
  private readonly rolesApi = inject(RolesApi);

  // ---------------------------------------------------------------------------
  // Private State
  // ---------------------------------------------------------------------------

  private readonly _state = signal<AdminUsersState>(initialState);

  // Subject for debounced search
  private readonly searchSubject = new Subject<string>();

  // ---------------------------------------------------------------------------
  // Public Selectors (Computed Signals)
  // ---------------------------------------------------------------------------

  // Query state
  readonly segment = computed(() => this._state().segment);
  readonly query = computed(() => this._state().query);
  readonly page = computed(() => this._state().page);
  readonly pageSize = computed(() => this._state().pageSize);

  // Loading states
  readonly loading = computed(() => this._state().loading);
  readonly loadingDetail = computed(() => this._state().loadingDetail);
  readonly saving = computed(() => this._state().saving);

  // Error
  readonly error = computed(() => this._state().error);
  readonly errorMessage = computed(() => this._state().error?.message ?? null);

  // Data
  readonly users = computed(() => this._state().users);
  readonly pagination = computed(() => this._state().pagination);
  readonly selectedUser = computed(() => this._state().selectedUser);

  // Roles catalog
  readonly rolesCatalog = computed(() => this._state().rolesCatalog);
  readonly loadingRoles = computed(() => this._state().loadingRoles);
  readonly roleNames = computed(() =>
    this._state().rolesCatalog.map((r) => r.name),
  );

  // Derived state
  readonly hasUsers = computed(() => this._state().users.length > 0);
  readonly totalUsers = computed(() => this._state().pagination.totalItems);
  readonly isEmpty = computed(
    () => !this._state().loading && this._state().users.length === 0,
  );
  readonly hasError = computed(() => this._state().error !== null);

  // Selected user helpers
  readonly selectedUserId = computed(() => this._state().selectedUser?.id);
  readonly selectedUserRoles = computed(
    () => this._state().selectedUser?.roles ?? [],
  );

  // ---------------------------------------------------------------------------
  // Constructor - Setup Debounced Search
  // ---------------------------------------------------------------------------

  constructor() {
    this.setupSearchDebounce();
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((query) => {
          this.updateState({
            query,
            page: 1, // Reset to first page on new search
          });
        }),
        switchMap(() => this.executeLoadUsers()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  // ---------------------------------------------------------------------------
  // Actions - Load Data
  // ---------------------------------------------------------------------------

  /**
   * Load users list with current query/pagination params
   */
  loadUsers(): void {
    this.executeLoadUsers().subscribe();
  }

  private executeLoadUsers() {
    this.updateState({ loading: true, error: null });

    const { query, page, pageSize } = this._state();
    const segment = this._state().segment;

    return this.usersApi
      .listUsersBySegment(segment, {
        q: query || undefined,
        page,
        pageSize,
      })
      .pipe(
        tap((response) => {
          this.updateState({
            users: response.data,
            pagination: response.pagination,
            loading: false,
          });
        }),
        catchError((err: AdminApiError) => {
          this.updateState({
            error: err,
            loading: false,
            users: [],
            pagination: initialPagination,
          });
          return of(null);
        }),
        finalize(() => {
          // Ensure loading is false even if observable completes unexpectedly
          if (this._state().loading) {
            this.updateState({ loading: false });
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      );
  }

  /**
   * Load roles catalog for dropdowns/assignment
   * Uses existing RolesApi GET /api/admin/roles
   */
  loadRolesCatalog(): void {
    this.updateState({ loadingRoles: true });

    this.rolesApi
      .getRoles()
      .pipe(
        tap((roles) => {
          this.updateState({
            rolesCatalog: roles,
            loadingRoles: false,
          });
        }),
        catchError(() => {
          // Silent fail for catalog - UI can show empty dropdown
          this.updateState({ loadingRoles: false });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  // ---------------------------------------------------------------------------
  // Actions - Query/Pagination
  // ---------------------------------------------------------------------------

  /**
   * Set search query with 300ms debounce.
   * Automatically resets to page 1.
   */
  setQuery(query: string): void {
    this.searchSubject.next(query);
  }

  /**
   * Set users segment (others/professionals/patients) and reload from page 1.
   */
  setSegment(segment: AdminUsersSegment): void {
    if (segment === this._state().segment) return;

    this.updateState({
      segment,
      page: 1,
      selectedUser: null,
    });

    this.loadUsers();
  }

  /**
   * Set current page and reload
   */
  setPage(page: number): void {
    if (page < 1) return;
    if (page === this._state().page) return;

    this.updateState({ page });
    this.loadUsers();
  }

  /**
   * Set page size, reset to page 1, and reload
   */
  setPageSize(size: number): void {
    if (size < 1) return;
    if (size === this._state().pageSize) return;

    this.updateState({ pageSize: size, page: 1 });
    this.loadUsers();
  }

  // ---------------------------------------------------------------------------
  // Actions - Select User (Load Detail)
  // ---------------------------------------------------------------------------

  /**
   * Select a user by ID and load their detailed info
   */
  selectUser(userId: string): void {
    if (!userId) {
      this.updateState({ selectedUser: null });
      return;
    }

    // If already selected and loaded, skip
    if (this._state().selectedUser?.id === userId) {
      return;
    }

    this.updateState({ loadingDetail: true, error: null });

    this.usersApi
      .getUser(userId)
      .pipe(
        tap((user) => {
          this.updateState({
            selectedUser: user,
            loadingDetail: false,
          });
        }),
        catchError((err: AdminApiError) => {
          this.updateState({
            error: err,
            loadingDetail: false,
            selectedUser: null,
          });
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /**
   * Clear selected user
   */
  clearSelectedUser(): void {
    this.updateState({ selectedUser: null });
  }

  // ---------------------------------------------------------------------------
  // Actions - CRUD Operations
  // ---------------------------------------------------------------------------

  /**
   * Create a new user
   * On success: refreshes list
   */
  createUser(dto: CreateUserDto): void {
    this.updateState({ saving: true, error: null });

    this.usersApi
      .createUser(dto)
      .pipe(
        tap((result) => {
          if (result.success) {
            // Refresh list after creation
            this.loadUsers();
          }
          this.updateState({ saving: false });
        }),
        catchError((err: AdminApiError) => {
          this.updateState({ error: err, saving: false });
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /**
   * Update an existing user
   * On success: refreshes list and reloads detail if same user is selected
   */
  updateUser(userId: string, dto: UpdateUserDto): void {
    this.updateState({ saving: true, error: null });

    this.usersApi
      .updateUser(userId, dto)
      .pipe(
        tap((result) => {
          if (result.success) {
            // Refresh list
            this.loadUsers();

            // If this user is currently selected, refresh detail
            if (this._state().selectedUser?.id === userId) {
              this.refreshSelectedUser(userId);
            }
          }
          this.updateState({ saving: false });
        }),
        catchError((err: AdminApiError) => {
          this.updateState({ error: err, saving: false });
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /**
   * Update user roles
   * On success: refreshes list and reloads detail if same user is selected
   */
  updateUserRoles(userId: string, dto: UpdateUserRolesDto): void {
    this.updateState({ saving: true, error: null });

    this.usersApi
      .updateUserRoles(userId, dto)
      .pipe(
        tap((result) => {
          if (result.success) {
            // Refresh list
            this.loadUsers();

            // If this user is currently selected, refresh detail
            if (this._state().selectedUser?.id === userId) {
              this.refreshSelectedUser(userId);
            }
          }
          this.updateState({ saving: false });
        }),
        catchError((err: AdminApiError) => {
          this.updateState({ error: err, saving: false });
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /**
   * Delete a user
   * On success: refreshes list and clears selected if same user
   */
  deleteUser(userId: string): void {
    this.updateState({ saving: true, error: null });

    this.usersApi
      .deleteUser(userId)
      .pipe(
        tap((result) => {
          if (result.success) {
            // If deleted user was selected, clear selection
            if (this._state().selectedUser?.id === userId) {
              this.updateState({ selectedUser: null });
            }

            // Refresh list
            this.loadUsers();
          }
          this.updateState({ saving: false });
        }),
        catchError((err: AdminApiError) => {
          this.updateState({ error: err, saving: false });
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  // ---------------------------------------------------------------------------
  // Actions - Error Handling
  // ---------------------------------------------------------------------------

  /**
   * Clear current error state
   */
  clearError(): void {
    this.updateState({ error: null });
  }

  // ---------------------------------------------------------------------------
  // Actions - Reset
  // ---------------------------------------------------------------------------

  /**
   * Reset store to initial state
   */
  reset(): void {
    this._state.set(initialState);
  }

  /**
   * Reset only the query/pagination, keeping catalog
   */
  resetFilters(): void {
    this.updateState({
      query: '',
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
    });
    this.loadUsers();
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  /**
   * Partial state update helper
   */
  private updateState(partial: Partial<AdminUsersState>): void {
    this._state.update((state) => ({ ...state, ...partial }));
  }

  /**
   * Refresh selected user detail after an update
   */
  private refreshSelectedUser(userId: string): void {
    this.usersApi
      .getUser(userId)
      .pipe(
        tap((user) => {
          this.updateState({ selectedUser: user });
        }),
        catchError(() => {
          // Silent fail for refresh - keep old data
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
