import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  AdminApiError,
  AdminUserDetailDto,
  AdminUserListDto,
  AdminUsersQueryParams,
  CreateUserDto,
  CreateUserResultDto,
  DeleteUserResultDto,
  PaginatedResponse,
  PaginatedResponseFormatA,
  PaginatedResponseFormatB,
  PaginationInfo,
  UpdateUserDto,
  UpdateUserResultDto,
  UpdateUserRolesDto,
  UpdateUserRolesResultDto,
  isPaginatedFormatA,
  isPaginatedFormatB,
  isProblemDetails,
} from './admin-users.types';
import { ApiClient } from './api-client';

/**
 * Admin Users API Service
 *
 * Handles all RBAC user management operations.
 * Base URL: /api/admin/rbac/users
 *
 * Required Permissions:
 * - Users.View: List and get user details
 * - Users.Create: Create new users
 * - Users.Update: Update user details
 * - Users.Delete: Delete users
 * - Users.AssignRoles: Manage user roles
 *
 * @example
 * ```typescript
 * // List users with search
 * this.adminUsersApi.listUsers({ q: 'john', page: 1, pageSize: 20 })
 *   .subscribe(response => {
 *     console.log(response.data); // AdminUserListDto[]
 *     console.log(response.pagination); // PaginationInfo
 *   });
 *
 * // Create user
 * this.adminUsersApi.createUser({
 *   userName: 'johndoe',
 *   email: 'john@example.com',
 *   password: 'SecurePass123!',
 *   confirmPassword: 'SecurePass123!',
 *   roles: ['User']
 * }).subscribe(result => {
 *   if (result.success) {
 *     console.log('User created:', result.userId);
 *   }
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AdminUsersApi {
  private readonly api = inject(ApiClient);
  private readonly basePath = '/admin/rbac/users';

  // ===========================================================================
  // READ Operations
  // ===========================================================================

  /**
   * GET /api/admin/rbac/users
   *
   * List users with optional filtering and pagination.
   * Normalizes response to standard PaginatedResponse format.
   *
   * @param params - Query parameters for filtering/pagination
   * @returns Observable with normalized paginated response
   */
  listUsers(
    params: AdminUsersQueryParams = {},
  ): Observable<PaginatedResponse<AdminUserListDto>> {
    const queryParams = this.buildQueryParams(params);

    return this.api
      .get<
        | PaginatedResponseFormatA<AdminUserListDto>
        | PaginatedResponseFormatB<AdminUserListDto>
      >(this.basePath, { params: queryParams })
      .pipe(
        map((response) =>
          this.normalizePaginatedResponse<AdminUserListDto>(response, params),
        ),
        catchError((error) => this.handleError(error)),
      );
  }

  /**
   * GET /api/admin/rbac/users/{userId}
   *
   * Get detailed information about a specific user.
   *
   * @param userId - The user's unique identifier
   * @returns Observable with user details
   */
  getUser(userId: string): Observable<AdminUserDetailDto> {
    return this.api
      .get<AdminUserDetailDto>(`${this.basePath}/${userId}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // ===========================================================================
  // WRITE Operations
  // ===========================================================================

  /**
   * POST /api/admin/rbac/users
   *
   * Create a new user account.
   *
   * @param dto - User creation data
   * @returns Observable with creation result
   */
  createUser(dto: CreateUserDto): Observable<CreateUserResultDto> {
    return this.api
      .post<CreateUserResultDto, CreateUserDto>(this.basePath, dto)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * PATCH /api/admin/rbac/users/{userId}
   *
   * Update user details (username, email, profile, lock status).
   *
   * @param userId - The user's unique identifier
   * @param dto - Fields to update
   * @returns Observable with update result
   */
  updateUser(
    userId: string,
    dto: UpdateUserDto,
  ): Observable<UpdateUserResultDto> {
    return this.api
      .patch<
        UpdateUserResultDto,
        UpdateUserDto
      >(`${this.basePath}/${userId}`, dto)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * PATCH /api/admin/rbac/users/{userId}/roles
   *
   * Update user's assigned roles.
   *
   * @param userId - The user's unique identifier
   * @param dto - New roles to assign
   * @returns Observable with roles update result
   */
  updateUserRoles(
    userId: string,
    dto: UpdateUserRolesDto,
  ): Observable<UpdateUserRolesResultDto> {
    return this.api
      .patch<
        UpdateUserRolesResultDto,
        UpdateUserRolesDto
      >(`${this.basePath}/${userId}/roles`, dto)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * DELETE /api/admin/rbac/users/{userId}
   *
   * Delete a user account.
   *
   * @param userId - The user's unique identifier
   * @returns Observable with deletion result
   */
  deleteUser(userId: string): Observable<DeleteUserResultDto> {
    return this.api
      .delete<DeleteUserResultDto>(`${this.basePath}/${userId}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  // ===========================================================================
  // Private Helpers
  // ===========================================================================

  /**
   * Build query params object from AdminUsersQueryParams
   */
  private buildQueryParams(
    params: AdminUsersQueryParams,
  ): Record<string, string | number | boolean> {
    const queryParams: Record<string, string | number | boolean> = {};

    if (params.q?.trim()) {
      queryParams['q'] = params.q.trim();
    }
    if (params.page !== undefined && params.page > 0) {
      queryParams['page'] = params.page;
    }
    if (params.pageSize !== undefined && params.pageSize > 0) {
      queryParams['pageSize'] = params.pageSize;
    }
    if (params.sortBy) {
      queryParams['sortBy'] = params.sortBy;
    }
    if (params.sortOrder) {
      queryParams['sortOrder'] = params.sortOrder;
    }
    if (params.role) {
      queryParams['role'] = params.role;
    }
    if (params.isLockedOut !== undefined) {
      queryParams['isLockedOut'] = params.isLockedOut;
    }

    return queryParams;
  }

  /**
   * Normalize different pagination response formats to standard format
   *
   * Supports two backend formats:
   * - Format A: { items, page, pageSize, totalCount, totalPages }
   * - Format B: { data, pagination: { currentPage, pageSize, totalItems, totalPages } }
   *
   * @returns Normalized PaginatedResponse<T>
   */
  private normalizePaginatedResponse<T>(
    response: unknown,
    params: AdminUsersQueryParams,
  ): PaginatedResponse<T> {
    // Format A: items-based
    if (isPaginatedFormatA<T>(response)) {
      const pagination: PaginationInfo = {
        currentPage: response.page,
        pageSize: response.pageSize,
        totalItems: response.totalCount,
        totalPages: response.totalPages,
        hasPrevious: response.hasPreviousPage ?? response.page > 1,
        hasNext: response.hasNextPage ?? response.page < response.totalPages,
      };

      return {
        data: response.items,
        pagination,
      };
    }

    // Format B: data + pagination object
    if (isPaginatedFormatB<T>(response)) {
      const pagination: PaginationInfo = {
        currentPage: response.pagination.currentPage,
        pageSize: response.pagination.pageSize,
        totalItems: response.pagination.totalItems,
        totalPages: response.pagination.totalPages,
        hasPrevious:
          response.pagination.hasPrevious ??
          response.pagination.currentPage > 1,
        hasNext:
          response.pagination.hasNext ??
          response.pagination.currentPage < response.pagination.totalPages,
      };

      return {
        data: response.data,
        pagination,
      };
    }

    // Fallback: assume it's an array (no pagination)
    if (Array.isArray(response)) {
      const data = response as T[];
      return {
        data,
        pagination: {
          currentPage: params.page ?? 1,
          pageSize: params.pageSize ?? data.length,
          totalItems: data.length,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
      };
    }

    // Unknown format - return empty with default pagination
    console.warn('[AdminUsersApi] Unknown response format:', response);
    return {
      data: [],
      pagination: {
        currentPage: params.page ?? 1,
        pageSize: params.pageSize ?? 10,
        totalItems: 0,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      },
    };
  }

  /**
   * Transform HTTP errors into typed AdminApiError
   *
   * Handles:
   * - ProblemDetails (RFC 7807) responses
   * - Standard HTTP errors
   * - Network errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    const apiError = this.parseError(error);
    return throwError(() => apiError);
  }

  /**
   * Parse HttpErrorResponse into AdminApiError
   */
  private parseError(error: HttpErrorResponse): AdminApiError {
    // Network error or client-side error
    if (error.error instanceof ErrorEvent) {
      return {
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Error de conexión. Verifica tu conexión a internet.',
        details: error.error.message,
      };
    }

    // Server returned ProblemDetails
    if (isProblemDetails(error.error)) {
      const problem = error.error;
      return {
        status: problem.status,
        code: this.getErrorCode(problem.status, problem.type),
        message: problem.title,
        details: problem.detail,
        validationErrors: problem.errors,
      };
    }

    // Server returned simple error object
    if (error.error && typeof error.error === 'object') {
      const errorBody = error.error as Record<string, unknown>;
      return {
        status: error.status,
        code: this.getErrorCode(error.status),
        message:
          (errorBody['message'] as string) ??
          (errorBody['title'] as string) ??
          this.getDefaultMessage(error.status),
        details: errorBody['detail'] as string | undefined,
      };
    }

    // Fallback to default error
    return {
      status: error.status,
      code: this.getErrorCode(error.status),
      message: this.getDefaultMessage(error.status),
      details: error.message,
    };
  }

  /**
   * Get error code from status and optional type
   */
  private getErrorCode(status: number, type?: string): string {
    if (type) {
      // Extract code from type URL if present
      const regex = /\/errors\/(\w+)$/;
      const match = regex.exec(type);
      if (match) {
        return match[1].toUpperCase();
      }
    }

    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      case 500:
        return 'SERVER_ERROR';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  /**
   * Get default user-friendly message for HTTP status
   */
  private getDefaultMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Solicitud inválida';
      case 401:
        return 'No autenticado. Por favor inicia sesión.';
      case 403:
        return 'No tienes permisos para realizar esta acción';
      case 404:
        return 'Usuario no encontrado';
      case 409:
        return 'El usuario ya existe o hay un conflicto';
      case 422:
        return 'Los datos proporcionados no son válidos';
      case 500:
        return 'Error interno del servidor';
      default:
        return 'Ha ocurrido un error inesperado';
    }
  }
}
