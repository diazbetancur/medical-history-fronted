import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import {
  CurrentUserDto,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserSession,
} from './api-models';

/**
 * Auth API Client
 * Handles authentication endpoints: /api/auth/*
 */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly api = inject(ApiClient);

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
   * GET /api/auth/me
   * Get current authenticated user session with contexts
   * Requires valid JWT token (added by interceptor)
   * @returns CurrentUserDto with roles, permissions, and available contexts
   */
  me(): Observable<CurrentUserDto> {
    return this.api.get<CurrentUserDto>('/auth/me');
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
}
