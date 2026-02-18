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

/**
 * Auth API Client
 * Handles authentication endpoints: /api/auth/*
 */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly api = inject(ApiClient);

  private normalizeContextType(
    type: string,
  ): 'ADMIN' | 'PROFESSIONAL' | 'PATIENT' {
    const value = (type || '').toUpperCase();
    if (value === 'ADMIN') return 'ADMIN';
    if (value === 'PROFESSIONAL') return 'PROFESSIONAL';
    return 'PATIENT';
  }

  private normalizeCurrentUser(raw: any): CurrentUserDto {
    const roles: string[] = raw?.roles ?? [];
    const permissions: string[] = raw?.permissions ?? [];
    const rawContexts = Array.isArray(raw?.contexts) ? raw.contexts : [];

    const contexts = rawContexts.map((context: any) => {
      if (typeof context === 'string') {
        const type = this.normalizeContextType(context);
        return {
          type,
          id:
            type === 'PROFESSIONAL'
              ? (raw?.professionalProfileId ?? raw?.userId ?? raw?.id ?? '')
              : (raw?.patientProfileId ?? raw?.userId ?? raw?.id ?? ''),
          name:
            raw?.fullName ??
            raw?.name ??
            raw?.userName ??
            raw?.email ??
            'Usuario',
          slug: raw?.professionalProfileSlug,
        };
      }

      const type = this.normalizeContextType(context?.type);
      return {
        type,
        id: context?.id ?? raw?.userId ?? raw?.id ?? '',
        name:
          context?.name ??
          raw?.fullName ??
          raw?.name ??
          raw?.userName ??
          raw?.email ??
          'Usuario',
        slug: context?.slug ?? raw?.professionalProfileSlug,
      };
    });

    const fallbackContext = {
      type: this.normalizeContextType(raw?.defaultContext ?? 'PATIENT'),
      id:
        raw?.patientProfileId ??
        raw?.professionalProfileId ??
        raw?.userId ??
        raw?.id ??
        '',
      name:
        raw?.fullName ?? raw?.name ?? raw?.userName ?? raw?.email ?? 'Usuario',
      slug: raw?.professionalProfileSlug,
    };

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
          (context: {
            type: 'ADMIN' | 'PROFESSIONAL' | 'PATIENT';
            id: string;
            name: string;
            slug?: string;
          }) =>
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
