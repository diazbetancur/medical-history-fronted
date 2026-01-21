/**
 * Admin Users RBAC Types
 *
 * Type definitions for the Admin Users management API.
 * Base URL: /api/admin/rbac/users
 *
 * Re-exports common types from api-models for convenience.
 */

import type {
  ProblemDetails as BaseProblemDetails,
  PaginationMeta,
} from './api-models';

// =============================================================================
// Pagination Types (Admin Users specific)
// =============================================================================

/**
 * Alias for PaginationMeta - standardized pagination info
 */
export type PaginationInfo = PaginationMeta;

/**
 * Standardized paginated response wrapper for Admin Users
 * Compatible with api-models PaginatedResponse
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * Backend format A: items-based pagination
 * Used by some endpoints
 */
export interface PaginatedResponseFormatA<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

/**
 * Backend format B: data + pagination object
 * Used by other endpoints
 */
export interface PaginatedResponseFormatB<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasPrevious?: boolean;
    hasNext?: boolean;
  };
}

// =============================================================================
// Error Types
// =============================================================================

/**
 * Extended ProblemDetails with traceId for Admin API
 */
export interface ProblemDetails extends BaseProblemDetails {
  traceId?: string;
}

/**
 * Typed API error for handling in components/stores
 */
export interface AdminApiError {
  status: number;
  code: string;
  message: string;
  details?: string;
  validationErrors?: Record<string, string[]>;
}

// =============================================================================
// User DTOs - Request Payloads
// =============================================================================

/**
 * DTO for creating a new user
 * POST /api/admin/rbac/users
 */
export interface CreateUserDto {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  roles?: string[];
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  sendWelcomeEmail?: boolean;
}

/**
 * DTO for updating user details
 * PATCH /api/admin/rbac/users/{userId}
 */
export interface UpdateUserDto {
  userName?: string;
  email?: string;
  isLockedOut?: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
}

/**
 * DTO for updating user roles
 * PATCH /api/admin/rbac/users/{userId}/roles
 */
export interface UpdateUserRolesDto {
  rolesToAdd: string[];
  rolesToRemove: string[];
}

// =============================================================================
// User DTOs - Response Types
// =============================================================================

/**
 * User item in list response
 * GET /api/admin/rbac/users
 */
export interface AdminUserListDto {
  id: string;
  userName: string;
  email: string;
  roles: string[];
  isLockedOut: boolean;
  createdAt: string;
  lastLogin?: string | null;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
}

/**
 * Detailed user response
 * GET /api/admin/rbac/users/{userId}
 */
export interface AdminUserDetailDto {
  id: string;
  userName: string;
  email: string;
  emailConfirmed: boolean;
  roles: string[];
  permissions: string[];
  isLockedOut: boolean;
  lockoutEnd?: string | null;
  createdAt: string;
  lastLogin?: string | null;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
  };
  metadata?: {
    loginCount?: number;
    lastPasswordChange?: string;
    twoFactorEnabled?: boolean;
  };
}

/**
 * Generic operation result from mutations
 */
export interface AdminOperationResultDto<T = void> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * User creation result
 */
export interface CreateUserResultDto extends AdminOperationResultDto<AdminUserDetailDto> {
  userId?: string;
}

/**
 * User update result
 */
export interface UpdateUserResultDto extends AdminOperationResultDto<AdminUserDetailDto> {
  // Inherits success, message, data
}

/**
 * Roles update result
 */
export interface UpdateUserRolesResultDto extends AdminOperationResultDto {
  previousRoles?: string[];
  currentRoles?: string[];
  addedRoles?: string[];
  removedRoles?: string[];
}

/**
 * User deletion result
 */
export interface DeleteUserResultDto extends AdminOperationResultDto {
  deletedUserId?: string;
}

// =============================================================================
// Query Parameters
// =============================================================================

/**
 * Query parameters for listing users
 */
export interface AdminUsersQueryParams {
  q?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'userName' | 'email' | 'createdAt' | 'lastLogin';
  sortOrder?: 'asc' | 'desc';
  role?: string;
  isLockedOut?: boolean;
}

// =============================================================================
// Type Guards
// =============================================================================

/**
 * Check if response is ProblemDetails error
 */
export function isProblemDetails(obj: unknown): obj is ProblemDetails {
  return (
    typeof obj === 'object' && obj !== null && 'title' in obj && 'status' in obj
  );
}

/**
 * Check if response is Format A pagination
 */
export function isPaginatedFormatA<T>(
  obj: unknown,
): obj is PaginatedResponseFormatA<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'items' in obj &&
    Array.isArray((obj as PaginatedResponseFormatA<T>).items) &&
    'totalCount' in obj
  );
}

/**
 * Check if response is Format B pagination
 */
export function isPaginatedFormatB<T>(
  obj: unknown,
): obj is PaginatedResponseFormatB<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'data' in obj &&
    Array.isArray((obj as PaginatedResponseFormatB<T>).data) &&
    'pagination' in obj
  );
}
