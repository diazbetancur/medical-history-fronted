import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import type {
  AssignRolesPayload,
  AvailableRole,
  RbacUser,
  RbacUserDetail,
} from '../api/users.api';
import { UsersApi } from '../api/users.api';

/**
 * Users Store
 *
 * Manages RBAC users state with signals
 */
@Injectable({ providedIn: 'root' })
export class UsersStore {
  private readonly usersApi = inject(UsersApi);

  // State
  readonly users = signal<RbacUser[]>([]);
  readonly selectedUser = signal<RbacUserDetail | null>(null);
  readonly availableRoles = signal<AvailableRole[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Computed
  readonly totalUsers = computed(() => this.users()?.length ?? 0);
  readonly activeUsers = computed(
    () => this.users()?.filter((u) => !u.isLockedOut).length ?? 0,
  );
  readonly hasUsers = computed(() => (this.users()?.length ?? 0) > 0);

  /**
   * Load all users
   */
  loadUsers() {
    this.loading.set(true);
    this.error.set(null);

    this.usersApi
      .getUsers()
      .pipe(
        tap((response) => {
          this.users.set(response.data);
        }),
        catchError((err) => {
          const errorMessage =
            err.status === 403
              ? 'No tienes permisos para ver usuarios'
              : 'Error al cargar usuarios';
          this.error.set(errorMessage);
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  /**
   * Load user detail
   */
  loadUserDetail(userId: string) {
    this.loading.set(true);
    this.error.set(null);

    this.usersApi
      .getUserDetail(userId)
      .pipe(
        tap((user) => {
          this.selectedUser.set(user);
        }),
        catchError((err) => {
          const errorMessage =
            err.status === 403
              ? 'No tienes permisos para ver este usuario'
              : 'Error al cargar detalles del usuario';
          this.error.set(errorMessage);
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  /**
   * Load available roles for assignment
   */
  loadAvailableRoles() {
    this.usersApi
      .getAvailableRoles()
      .pipe(
        tap((response) => {
          this.availableRoles.set(response.roles);
        }),
        catchError(() => {
          return of(null);
        }),
      )
      .subscribe();
  }

  /**
   * Assign roles to a user
   */
  assignRoles(userId: string, payload: AssignRolesPayload) {
    this.loading.set(true);
    this.error.set(null);

    return this.usersApi.assignRoles(userId, payload).pipe(
      tap((response) => {
        // Update user in the list
        this.users.update((users) =>
          users.map((u) => (u.id === userId ? response.user : u)),
        );

        // Update selected user if it's the same
        if (this.selectedUser()?.id === userId) {
          this.selectedUser.update((current) =>
            current ? { ...current, roles: response.user.roles } : null,
          );
        }
      }),
      catchError((err) => {
        const errorMessage =
          err.status === 403
            ? 'No tienes permisos para asignar roles'
            : 'Error al asignar roles';
        this.error.set(errorMessage);
        throw err; // Re-throw for component handling
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  /**
   * Clear error
   */
  clearError() {
    this.error.set(null);
  }

  /**
   * Clear selected user
   */
  clearSelectedUser() {
    this.selectedUser.set(null);
  }
}
