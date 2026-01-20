import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { LoginRequest, LoginResponse, UserSession } from './api-models';

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
   * GET /api/auth/me
   * Get current authenticated user session
   * Requires valid JWT token (added by interceptor)
   */
  me(): Observable<UserSession> {
    return this.api.get<UserSession>('/auth/me');
  }
}
