import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

/**
 * User Models
 */
export interface RbacUser {
  id: string;
  userName: string;
  email: string;
  roles: string[];
  isLockedOut: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface RbacUsersResponse {
  data: RbacUser[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
}

export interface RbacUserDetail extends RbacUser {
  permissions: string[];
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

export interface AssignRolesPayload {
  roles: string[];
}

export interface AssignRolesResponse {
  success: boolean;
  message?: string;
  user: RbacUser;
}

export interface AvailableRole {
  id: string;
  name: string;
  description?: string;
  permissionCount?: number;
}

/**
 * Users API Client
 * Handles RBAC user management endpoints: /api/admin/rbac/users/*
 * Requires Users.View, Users.AssignRoles permissions
 */
@Injectable({ providedIn: 'root' })
export class UsersApi {
  private readonly api = inject(ApiClient);

  /**
   * GET /api/admin/rbac/users
   * List all users with their roles
   */
  getUsers(): Observable<RbacUsersResponse> {
    return this.api.get<RbacUsersResponse>('/admin/rbac/users');
  }

  /**
   * GET /api/admin/rbac/users/{id}
   * Get detailed user information including permissions
   */
  getUserDetail(userId: string): Observable<RbacUserDetail> {
    return this.api.get<RbacUserDetail>(`/admin/rbac/users/${userId}`);
  }

  /**
   * PATCH /api/admin/rbac/users/{id}/roles
   * Assign roles to a user
   * Requires Users.AssignRoles permission
   */
  assignRoles(
    userId: string,
    payload: AssignRolesPayload,
  ): Observable<AssignRolesResponse> {
    return this.api.patch<AssignRolesResponse>(
      `/admin/rbac/users/${userId}/roles`,
      payload,
    );
  }

  /**
   * GET /api/admin/rbac/roles
   * Get list of available roles for assignment
   */
  getAvailableRoles(): Observable<{ roles: AvailableRole[] }> {
    return this.api.get<{ roles: AvailableRole[] }>('/admin/rbac/roles');
  }
}
