import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClient } from './api-client';
import {
  BecomeProfessionalRequest,
  ChangePasswordRequest,
  CurrentUserDto,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  UserOperationResultDto,
  UserSession,
} from './api-models';

type UserContextType = CurrentUserDto['defaultContext']['type'];

/**
 * Auth API Client
 * Handles authentication endpoints: /api/auth/*
 */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly api = inject(ApiClient);

  private normalizeContextType(type: string | Record<string, unknown>): UserContextType {
    // Backend may send defaultContext as a full ContextDto object {type, id, name}
    // (new API) or as a plain string (legacy API). Handle both formats.
    const rawType = type && typeof type === 'object' ? (type as any)['type'] : type;
    const value = String(rawType || '').toUpperCase();
    if (value === 'ADMIN') return 'ADMIN';
    if (value === 'PROFESSIONAL') return 'PROFESSIONAL';
    return 'PATIENT';
  }

  private buildContext(
    raw: any,
    type: UserContextType,
    source?: any,
  ): CurrentUserDto['defaultContext'] {
    const name =
      source?.name ??
      raw?.fullName ??
      raw?.name ??
      raw?.userName ??
      raw?.email ??
      'Usuario';

    switch (type) {
      case 'ADMIN':
        return {
          type,
          id: source?.id ?? raw?.userId ?? raw?.id ?? '',
          name,
        };
      case 'PROFESSIONAL':
        return {
          type,
          id:
            source?.id ??
            raw?.professionalProfileId ??
            raw?.userId ??
            raw?.id ??
            '',
          name,
          slug: source?.slug ?? raw?.professionalProfileSlug,
        };
      default:
        return {
          type: 'PATIENT',
          id:
            source?.id ?? raw?.patientProfileId ?? raw?.userId ?? raw?.id ?? '',
          name,
        };
    }
  }

  private upsertContext(
    contexts: CurrentUserDto['contexts'],
    nextContext: CurrentUserDto['defaultContext'],
  ): void {
    const existingIndex = contexts.findIndex(
      (context) => context.type === nextContext.type,
    );

    if (existingIndex >= 0) {
      contexts[existingIndex] = {
        ...contexts[existingIndex],
        ...nextContext,
      };
      return;
    }

    contexts.push(nextContext);
  }

  private mapRawContext(
    raw: any,
    context: any,
  ): CurrentUserDto['defaultContext'] {
    if (typeof context === 'string') {
      return this.buildContext(raw, this.normalizeContextType(context));
    }

    return this.buildContext(
      raw,
      this.normalizeContextType(context?.type),
      context,
    );
  }

  private ensureRoleContexts(
    raw: any,
    contexts: CurrentUserDto['contexts'],
    hasPatientRole: boolean,
    hasProfessionalRole: boolean,
    hasPrivilegedRole: boolean,
  ): void {
    if (
      hasPatientRole ||
      this.normalizeContextType(raw?.defaultContext ?? '') === 'PATIENT'
    ) {
      this.upsertContext(contexts, this.buildContext(raw, 'PATIENT'));
    }

    if (hasProfessionalRole) {
      this.upsertContext(contexts, this.buildContext(raw, 'PROFESSIONAL'));
    }

    if (hasPrivilegedRole) {
      this.upsertContext(contexts, this.buildContext(raw, 'ADMIN'));
    }
  }

  private getDefaultContextType(
    raw: any,
    hasPrivilegedRole: boolean,
    hasPatientRole: boolean,
    hasProfessionalRole: boolean,
  ): UserContextType {
    if (raw?.defaultContext) {
      return this.normalizeContextType(raw.defaultContext);
    }

    if (hasPrivilegedRole) {
      return 'ADMIN';
    }

    if (hasPatientRole) {
      return 'PATIENT';
    }

    if (hasProfessionalRole) {
      return 'PROFESSIONAL';
    }

    return 'PATIENT';
  }

  private normalizeCurrentUser(raw: any): CurrentUserDto {
    const roles: string[] = raw?.roles ?? [];
    const permissions: string[] = raw?.permissions ?? [];
    const rawContexts = Array.isArray(raw?.contexts) ? raw.contexts : [];
    const normalizedRoles = new Set(
      roles
        .map((role) =>
          String(role ?? '')
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean),
    );
    const hasPatientRole =
      normalizedRoles.has('CLIENT') || normalizedRoles.has('PATIENT');
    const hasProfessionalRole = normalizedRoles.has('PROFESSIONAL');
    const hasPrivilegedRole = [...normalizedRoles].some(
      (role) => !['CLIENT', 'PATIENT', 'PROFESSIONAL'].includes(role),
    );

    const contexts = rawContexts.map((context: any) =>
      this.mapRawContext(raw, context),
    );

    this.ensureRoleContexts(
      raw,
      contexts,
      hasPatientRole,
      hasProfessionalRole,
      hasPrivilegedRole,
    );

    const defaultContextType = this.getDefaultContextType(
      raw,
      hasPrivilegedRole,
      hasPatientRole,
      hasProfessionalRole,
    );

    const fallbackContext =
      contexts.find(
        (context: CurrentUserDto['contexts'][number]) =>
          context.type === defaultContextType,
      ) ?? this.buildContext(raw, defaultContextType);

    return {
      id: raw?.id ?? raw?.userId ?? '',
      email: raw?.email ?? '',
      name:
        raw?.name ?? raw?.fullName ?? raw?.userName ?? raw?.email ?? 'Usuario',
      roles,
      permissions,
      contexts: contexts.length > 0 ? contexts : [fallbackContext],
      defaultContext:
        contexts.find(
          (context: CurrentUserDto['contexts'][number]) =>
            context.type ===
            this.normalizeContextType(raw?.defaultContext ?? ''),
        ) ?? fallbackContext,
      professionalProfileId: raw?.professionalProfileId,
      professionalProfileSlug: raw?.professionalProfileSlug,
      hasProfessionalProfile:
        raw?.hasProfessionalProfile === true ||
        (!!raw?.professionalProfileId &&
          raw.professionalProfileId !== '' &&
          raw.professionalProfileId !== null),
      csrfToken: raw?.csrfToken ?? '',
    };
  }

  /**
   * POST /api/auth/login
   * Authenticate user and get JWT token
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', credentials);
  }

  /**
   * POST /api/auth/register
   * Register a new user account
   */
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.api.post<RegisterResponse>('/auth/register', data);
  }

  /**
   * POST /api/auth/change-password
   * Change password for authenticated user
   */
  changePassword(
    data: ChangePasswordRequest,
  ): Observable<UserOperationResultDto> {
    return this.api.post<UserOperationResultDto>('/auth/change-password', data);
  }

  /**
   * POST /api/auth/forgot-password
   * Request password reset token by email
   */
  forgotPassword(
    data: ForgotPasswordRequest,
  ): Observable<UserOperationResultDto> {
    return this.api.post<UserOperationResultDto>('/auth/forgot-password', data);
  }

  /**
   * POST /api/auth/reset-password
   * Reset password using token
   */
  resetPassword(
    data: ResetPasswordRequest,
  ): Observable<UserOperationResultDto> {
    return this.api.post<UserOperationResultDto>('/auth/reset-password', data);
  }

  /**
   * GET /api/auth/me
   * Get current authenticated user session with contexts
   * Requires valid JWT token (added by interceptor)
   * @returns CurrentUserDto with roles, permissions, and available contexts
   */
  me(): Observable<CurrentUserDto> {
    return this.api
      .get<any>('/auth/me')
      .pipe(map((response) => this.normalizeCurrentUser(response)));
  }

  /**
   * GET /api/auth/me (legacy method)
   * @deprecated Use me() instead which returns CurrentUserDto
   * Get current authenticated user session
   * Requires valid JWT token (added by interceptor)
   */
  getLegacySession(): Observable<UserSession> {
    return this.api.get<UserSession>('/auth/me');
  }

  /**
   * POST /api/auth/logout
   * Clears the httpOnly auth cookie on the server side
   */
  logout(): Observable<void> {
    return this.api.post<void>('/auth/logout', {});
  }

  /**
   * POST /api/auth/become-professional
   * Grants Professional role to an authenticated client user
   */
  becomeProfessional(
    payload: BecomeProfessionalRequest = {},
  ): Observable<UserOperationResultDto> {
    return this.api.post<UserOperationResultDto>(
      '/auth/become-professional',
      payload,
    );
  }
}
