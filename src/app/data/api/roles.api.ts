import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

/**
 * Role Models
 */
export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissionsCount?: number; // Added from backend response
  createdAt?: string;
  updatedAt?: string;
}

// Backend returns array directly
export type RolesResponse = Role[];

export interface CreateRolePayload {
  name: string;
  description?: string;
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
}

export interface CreateRoleResponse {
  success: boolean;
  role: Role;
  message?: string;
}

export interface UpdateRoleResponse {
  success: boolean;
  role: Role;
  message?: string;
}

export interface DeleteRoleResponse {
  success: boolean;
  message?: string;
}

/**
 * Permission Models
 * Backend returns permissions as simple strings, not objects
 */
export interface Permission {
  name: string;
  module: string;
}

/**
 * Module with its permissions (from backend)
 */
export interface PermissionModuleResponse {
  name: string;
  permissions: string[];
}

export interface PermissionsResponse {
  total: number;
  permissions: string[];
  modules: PermissionModuleResponse[];
}

export interface RolePermissionsResponse {
  roleId: string;
  roleName: string;
  permissions: string[];
}

export interface UpdateRolePermissionsPayload {
  permissions: string[]; // Backend expects permission names, not IDs
}

export interface UpdateRolePermissionsResponse {
  success: boolean;
  message?: string;
  addedCount: number;
  removedCount: number;
}

/**
 * Grouped permissions by module (for UI display)
 * Note: This is used locally in the store, backend uses PermissionModuleResponse
 */
export interface PermissionModule {
  moduleName: string;
  permissions: string[];
}

/**
 * Roles API Client
 * Handles role and permission management endpoints: /api/admin/roles/*
 * Requires Roles.View, Roles.Create, Roles.Update, Roles.Delete permissions
 */
@Injectable({ providedIn: 'root' })
export class RolesApi {
  private readonly api = inject(ApiClient);

  // ===========================================================================
  // Roles Management
  // ===========================================================================

  /**
   * GET /api/admin/roles
   * List all roles
   */
  getRoles(): Observable<RolesResponse> {
    return this.api.get<RolesResponse>('/admin/roles');
  }

  /**
   * POST /api/admin/roles
   * Create a new role
   * Requires Roles.Create permission
   */
  createRole(payload: CreateRolePayload): Observable<CreateRoleResponse> {
    return this.api.post<CreateRoleResponse>('/admin/roles', payload);
  }

  /**
   * PATCH /api/admin/roles/{id}
   * Update an existing role
   * Requires Roles.Update permission
   * Note: Cannot update system roles (isSystem: true)
   */
  updateRole(
    roleId: string,
    payload: UpdateRolePayload,
  ): Observable<UpdateRoleResponse> {
    return this.api.patch<UpdateRoleResponse>(
      `/admin/roles/${roleId}`,
      payload,
    );
  }

  /**
   * DELETE /api/admin/roles/{id}
   * Delete a role
   * Requires Roles.Delete permission
   * Note: Cannot delete system roles (isSystem: true)
   */
  deleteRole(roleId: string): Observable<DeleteRoleResponse> {
    return this.api.delete<DeleteRoleResponse>(`/admin/roles/${roleId}`);
  }

  // ===========================================================================
  // Permissions Management
  // ===========================================================================

  /**
   * GET /api/admin/permissions
   * List all available permissions in the system
   */
  getPermissions(): Observable<PermissionsResponse> {
    return this.api.get<PermissionsResponse>('/admin/permissions');
  }

  /**
   * GET /api/admin/roles/{id}/permissions
   * Get permissions assigned to a specific role
   */
  getRolePermissions(roleId: string): Observable<RolePermissionsResponse> {
    return this.api.get<RolePermissionsResponse>(
      `/admin/roles/${roleId}/permissions`,
    );
  }

  /**
   * PUT /api/admin/roles/{id}/permissions
   * Update permissions for a role (replaces existing permissions)
   * Requires Roles.ManagePermissions permission
   *
   * @param roleId Role ID
   * @param payload Object with permissionIds array
   * @returns Response with success status and counts
   */
  updateRolePermissions(
    roleId: string,
    payload: UpdateRolePermissionsPayload,
  ): Observable<UpdateRolePermissionsResponse> {
    return this.api.put<UpdateRolePermissionsResponse>(
      `/admin/roles/${roleId}/permissions`,
      payload,
    );
  }
}
