import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, of, tap } from 'rxjs';
import type {
  CreateRolePayload,
  PermissionModuleResponse,
  Role,
  UpdateRolePayload,
  UpdateRolePermissionsPayload,
} from '../api/roles.api';
import { RolesApi } from '../api/roles.api';

/**
 * Module with permissions for UI display
 */
export interface PermissionModuleDisplay {
  moduleName: string;
  permissions: string[];
}

/**
 * Roles Store
 *
 * Manages roles and permissions state with signals
 * Backend returns permissions as strings organized by modules
 */
@Injectable({ providedIn: 'root' })
export class RolesStore {
  private readonly rolesApi = inject(RolesApi);

  // State
  readonly roles = signal<Role[]>([]);
  readonly allPermissions = signal<string[]>([]);
  readonly permissionModules = signal<PermissionModuleResponse[]>([]);
  readonly selectedRole = signal<Role | null>(null);
  readonly selectedRolePermissions = signal<string[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  // Computed
  readonly totalRoles = computed(() => this.roles()?.length ?? 0);
  readonly systemRoles = computed(
    () => this.roles()?.filter((r) => r.isSystem) ?? [],
  );
  readonly customRoles = computed(
    () => this.roles()?.filter((r) => !r.isSystem) ?? [],
  );
  readonly hasRoles = computed(() => (this.roles()?.length ?? 0) > 0);

  /**
   * Group permissions by module (from backend modules structure)
   */
  readonly permissionsByModule = computed<PermissionModuleDisplay[]>(() => {
    const modules = this.permissionModules();
    if (!modules || modules.length === 0) {
      return [];
    }

    return modules
      .map((mod) => ({
        moduleName: mod.name,
        permissions: [...mod.permissions].sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => a.moduleName.localeCompare(b.moduleName));
  });

  /**
   * Selected role permission names for easy checking
   */
  readonly selectedRolePermissionNames = computed(
    () => new Set(this.selectedRolePermissions()),
  );

  /**
   * Load all roles
   */
  loadRoles() {
    this.loading.set(true);
    this.error.set(null);

    this.rolesApi
      .getRoles()
      .pipe(
        tap((response) => {
          // Backend returns array directly
          this.roles.set(response);
        }),
        catchError((err) => {
          const errorMessage =
            err.status === 403
              ? 'No tienes permisos para ver roles'
              : 'Error al cargar roles';
          this.error.set(errorMessage);
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  /**
   * Load all available permissions
   */
  loadPermissions() {
    this.loading.set(true);
    this.error.set(null);

    this.rolesApi
      .getPermissions()
      .pipe(
        tap((response) => {
          this.allPermissions.set(response.permissions);
          this.permissionModules.set(response.modules);
        }),
        catchError((err) => {
          const errorMessage =
            err.status === 403
              ? 'No tienes permisos para ver permisos'
              : 'Error al cargar permisos';
          this.error.set(errorMessage);
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  /**
   * Load permissions for a specific role
   */
  loadRolePermissions(roleId: string) {
    this.loading.set(true);
    this.error.set(null);

    // Find and set the selected role
    const role = this.roles().find((r) => r.id === roleId);
    if (role) {
      this.selectedRole.set(role);
    }

    this.rolesApi
      .getRolePermissions(roleId)
      .pipe(
        tap((response) => {
          this.selectedRolePermissions.set(response.permissions);
        }),
        catchError((err) => {
          const errorMessage =
            err.status === 403
              ? 'No tienes permisos para ver permisos del rol'
              : 'Error al cargar permisos del rol';
          this.error.set(errorMessage);
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  /**
   * Create a new role
   */
  createRole(payload: CreateRolePayload) {
    this.saving.set(true);
    this.error.set(null);

    return this.rolesApi.createRole(payload).pipe(
      tap(() => {
        // Backend returns operation result; refresh list from source of truth
        this.loadRoles();
      }),
      catchError((err) => {
        const errorMessage =
          err.status === 403
            ? 'No tienes permisos para crear roles'
            : err.error?.message || 'Error al crear rol';
        this.error.set(errorMessage);
        throw err;
      }),
      finalize(() => this.saving.set(false)),
    );
  }

  /**
   * Update an existing role
   */
  updateRole(roleId: string, payload: UpdateRolePayload) {
    this.saving.set(true);
    this.error.set(null);

    return this.rolesApi.updateRole(roleId, payload).pipe(
      tap(() => {
        // Backend returns operation result; refresh list from source of truth
        this.loadRoles();
      }),
      catchError((err) => {
        const errorMessage =
          err.status === 403
            ? 'No tienes permisos para editar roles'
            : err.error?.message || 'Error al actualizar rol';
        this.error.set(errorMessage);
        throw err;
      }),
      finalize(() => this.saving.set(false)),
    );
  }

  /**
   * Delete a role
   */
  deleteRole(roleId: string) {
    this.saving.set(true);
    this.error.set(null);

    return this.rolesApi.deleteRole(roleId).pipe(
      tap(() => {
        // Remove role from the list
        this.roles.update((roles) => roles.filter((r) => r.id !== roleId));

        // Clear selected role if it was deleted
        if (this.selectedRole()?.id === roleId) {
          this.selectedRole.set(null);
        }
      }),
      catchError((err) => {
        const errorMessage =
          err.status === 403
            ? 'No tienes permisos para eliminar roles'
            : err.error?.message || 'Error al eliminar rol';
        this.error.set(errorMessage);
        throw err;
      }),
      finalize(() => this.saving.set(false)),
    );
  }

  /**
   * Update permissions for a role
   */
  updateRolePermissions(roleId: string, payload: UpdateRolePermissionsPayload) {
    this.saving.set(true);
    this.error.set(null);

    return this.rolesApi.updateRolePermissions(roleId, payload).pipe(
      tap(() => {
        // Reload role permissions to get updated state
        this.loadRolePermissions(roleId);
      }),
      catchError((err) => {
        const errorMessage =
          err.status === 403
            ? 'No tienes permisos para gestionar permisos'
            : err.error?.message || 'Error al actualizar permisos';
        this.error.set(errorMessage);
        throw err;
      }),
      finalize(() => this.saving.set(false)),
    );
  }

  /**
   * Clear error
   */
  clearError() {
    this.error.set(null);
  }

  /**
   * Clear selected role and permissions
   */
  clearSelection() {
    this.selectedRole.set(null);
    this.selectedRolePermissions.set([]);
  }

  /**
   * Check if a role is system role
   */
  isSystemRole(roleId: string): boolean {
    const role = this.roles().find((r) => r.id === roleId);
    return role?.isSystem ?? false;
  }
}
