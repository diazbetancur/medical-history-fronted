import { isPlatformBrowser } from '@angular/common';
import {
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import {
  AuthApi,
  getErrorMessage,
  LoginResponse,
  UserSession as ApiUserSession,
} from '@data/api';
import {
  getPrimaryRole,
  hasAllRoles,
  hasAnyRole,
  isAdminUser,
  isProfessionalUser,
  isSuperAdmin,
} from './roles';
import { TokenStorage } from './token-storage.service';

/**
 * Internal session state - enriched version of API session
 * Uses string[] for roles to handle unknown roles from API gracefully
 */
export interface SessionState {
  isAuthenticated: boolean;
  loading: boolean;
  userId: string | null;
  userName: string | null;
  email: string | null;
  roles: string[]; // Dynamic array - can contain any roles from API
  permissions: string[]; // Future: fine-grained permissions
  hasProfessionalProfile: boolean;
  professionalProfileId: string | null;
  professionalProfileSlug: string | null;
}

const INITIAL_SESSION: SessionState = {
  isAuthenticated: false,
  loading: false,
  userId: null,
  userName: null,
  email: null,
  roles: [],
  permissions: [],
  hasProfessionalProfile: false,
  professionalProfileId: null,
  professionalProfileSlug: null,
};

/**
 * Authentication Service
 * Manages user session state using signals and real API integration.
 * SSR-safe: token operations only happen in browser.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authApi = inject(AuthApi);
  private readonly tokenStorage = inject(TokenStorage);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  // Private writable signal
  private readonly _session = signal<SessionState>(INITIAL_SESSION);
  private readonly _loginError = signal<string | null>(null);

  // Public read-only signals
  readonly session = this._session.asReadonly();
  readonly loading = computed(() => this._session().loading);
  readonly loginError = this._loginError.asReadonly();
  readonly isAuthenticated = computed(() => this._session().isAuthenticated);
  readonly userId = computed(() => this._session().userId);
  readonly userName = computed(() => this._session().userName);
  readonly email = computed(() => this._session().email);
  readonly roles = computed(() => this._session().roles);
  readonly permissions = computed(() => this._session().permissions);

  // Role checks using centralized role utilities
  readonly isAdmin = computed(() => isAdminUser(this._session().roles));
  readonly isSuperAdmin = computed(() => isSuperAdmin(this._session().roles));
  readonly isProfessional = computed(() =>
    isProfessionalUser(this._session().roles)
  );
  readonly isClient = computed(() => this._session().roles.includes('Client'));
  readonly primaryRole = computed(() => getPrimaryRole(this._session().roles));

  // Professional profile info
  readonly hasProfessionalProfile = computed(
    () => this._session().hasProfessionalProfile
  );
  readonly professionalProfileId = computed(
    () => this._session().professionalProfileId
  );
  readonly professionalProfileSlug = computed(
    () => this._session().professionalProfileSlug
  );

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Initialize auth state from stored token (call on app init)
   * Only runs in browser and if a valid token exists
   */
  initialize(): Observable<ApiUserSession | null> {
    if (!this.isBrowser || !this.tokenStorage.hasValidToken()) {
      return of(null);
    }

    this._session.update((s) => ({ ...s, loading: true }));

    return this.authApi.me().pipe(
      tap((session) => {
        this._session.set({
          isAuthenticated: true,
          loading: false,
          userId: session.userId,
          userName: session.userName,
          email: session.email,
          roles: session.roles,
          permissions: session.permissions || [],
          hasProfessionalProfile: session.hasProfessionalProfile,
          professionalProfileId: session.professionalProfileId,
          professionalProfileSlug: session.professionalProfileSlug,
        });
      }),
      catchError((err) => {
        // Token is invalid or expired
        console.warn('[AuthService] Failed to restore session:', err);
        this.tokenStorage.clearToken();
        this._session.set(INITIAL_SESSION);
        return of(null);
      })
    );
  }

  /**
   * Login with email and password
   * Returns Observable<LoginResponse> on success
   */
  login(email: string, password: string): Observable<LoginResponse> {
    this._session.update((s) => ({ ...s, loading: true }));
    this._loginError.set(null);

    return this.authApi.login({ email, password }).pipe(
      tap((response) => {
        // Store token
        this.tokenStorage.setToken(response.token, response.expiresAt);

        // Set initial session from login response
        this._session.set({
          isAuthenticated: true,
          loading: false,
          userId: response.user.id,
          userName: response.user.userName,
          email: response.user.email,
          roles: response.user.roles,
          permissions: [], // Will be populated by /me call if backend supports it
          hasProfessionalProfile: false, // Will be updated by /me call
          professionalProfileId: null,
          professionalProfileSlug: null,
        });
      }),
      catchError((err) => {
        const message = getErrorMessage(err?.error ?? err);
        this._loginError.set(message);
        this._session.update((s) => ({ ...s, loading: false }));
        return throwError(() => err);
      })
    );
  }

  /**
   * Login and then fetch full session with /me
   * Use this for complete session info including professional profile
   */
  loginAndFetchSession(
    email: string,
    password: string
  ): Observable<ApiUserSession> {
    return new Observable((subscriber) => {
      this.login(email, password).subscribe({
        next: () => {
          // After login, fetch full session
          this.authApi.me().subscribe({
            next: (session) => {
              this._session.set({
                isAuthenticated: true,
                loading: false,
                userId: session.userId,
                userName: session.userName,
                email: session.email,
                roles: session.roles,
                permissions: session.permissions || [],
                hasProfessionalProfile: session.hasProfessionalProfile,
                professionalProfileId: session.professionalProfileId,
                professionalProfileSlug: session.professionalProfileSlug,
              });
              subscriber.next(session);
              subscriber.complete();
            },
            error: (err) => subscriber.error(err),
          });
        },
        error: (err) => subscriber.error(err),
      });
    });
  }

  /**
   * Refresh session from /me endpoint
   * Use after profile changes or to verify token
   */
  refreshSession(): Observable<ApiUserSession> {
    return this.authApi.me().pipe(
      tap((session) => {
        this._session.update((s) => ({
          ...s,
          userId: session.userId,
          userName: session.userName,
          email: session.email,
          roles: session.roles,
          permissions: session.permissions || [],
          hasProfessionalProfile: session.hasProfessionalProfile,
          professionalProfileId: session.professionalProfileId,
          professionalProfileSlug: session.professionalProfileSlug,
        }));
      })
    );
  }

  /**
   * Clear session and logout
   */
  logout(redirectTo?: string): void {
    this.tokenStorage.clearToken();
    this._session.set(INITIAL_SESSION);
    this._loginError.set(null);

    if (redirectTo) {
      this.router.navigate([redirectTo]);
    }
  }

  /**
   * Check if user has a specific role.
   * Handles unknown roles gracefully.
   */
  hasRole(role: string): boolean {
    return this._session().roles.includes(role);
  }

  /**
   * Check if user has any of the specified roles.
   * Uses centralized role checking utility.
   */
  hasAnyRole(roles: readonly string[]): boolean {
    return hasAnyRole(this._session().roles, roles);
  }

  /**
   * Check if user has all of the specified roles.
   * Uses centralized role checking utility.
   */
  hasAllRoles(roles: readonly string[]): boolean {
    return hasAllRoles(this._session().roles, roles);
  }

  /**
   * Check if user has a specific permission.
   * For future fine-grained access control.
   */
  hasPermission(permission: string): boolean {
    return this._session().permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions.
   */
  hasAnyPermission(permissions: readonly string[]): boolean {
    return hasAnyRole(this._session().permissions, permissions);
  }

  /**
   * Check if user has all of the specified permissions.
   */
  hasAllPermissions(permissions: readonly string[]): boolean {
    return hasAllRoles(this._session().permissions, permissions);
  }

  /**
   * Clear login error
   */
  clearLoginError(): void {
    this._loginError.set(null);
  }
}
