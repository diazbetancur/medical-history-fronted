import { isPlatformBrowser } from '@angular/common';
import {
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ContextDto, CurrentUserDto, ProblemDetails } from '@core/models';
import { AuthApi } from '@data/api';
import { catchError, Observable, of, tap } from 'rxjs';
import { TokenStorage } from './token-storage.service';

const CURRENT_CONTEXT_KEY = 'auth_current_context';

/**
 * Auth Store State
 * Manages authentication state with signals
 */
export interface AuthState {
  /** JWT token */
  token: string | null;

  /** Current authenticated user */
  user: CurrentUserDto | null;

  /** Currently active context */
  currentContext: ContextDto | null;

  /** Loading state (for async operations) */
  isLoading: boolean;

  /** Last error (ProblemDetails format) */
  lastError: ProblemDetails | null;
}

const INITIAL_STATE: AuthState = {
  token: null,
  user: null,
  currentContext: null,
  isLoading: false,
  lastError: null,
};

/**
 * Authentication Store (Signal-based)
 * Manages user session, token, and context switching
 * SSR-safe: localStorage operations only in browser
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authApi = inject(AuthApi);
  private readonly tokenStorage = inject(TokenStorage);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  // Private writable signal
  private readonly _state = signal<AuthState>(INITIAL_STATE);

  // Public read-only signals
  readonly state = this._state.asReadonly();
  readonly token = computed(() => this._state().token);
  readonly user = computed(() => this._state().user);
  readonly currentContext = computed(() => this._state().currentContext);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly lastError = computed(() => this._state().lastError);

  // Derived signals
  readonly isAuthenticated = computed(() => !!this._state().user);
  readonly userId = computed(() => this._state().user?.id ?? null);
  readonly userName = computed(() => this._state().user?.name ?? null);
  readonly userEmail = computed(() => this._state().user?.email ?? null);
  readonly userRoles = computed(() => this._state().user?.roles ?? []);
  readonly userPermissions = computed(
    () => this._state().user?.permissions ?? [],
  );
  readonly availableContexts = computed(
    () => this._state().user?.contexts ?? [],
  );

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Set JWT token and persist to localStorage
   */
  setToken(token: string, expiresAt: string): void {
    this._state.update((state) => ({ ...state, token }));
    this.tokenStorage.setToken(token, expiresAt);
  }

  /**
   * Load current user from /api/auth/me
   * Sets user and currentContext (from defaultContext or persisted)
   * Returns Observable<CurrentUserDto | null>
   */
  loadMe(): Observable<CurrentUserDto | null> {
    // Clear previous error
    this._state.update((state) => ({
      ...state,
      isLoading: true,
      lastError: null,
    }));

    return this.authApi.me().pipe(
      tap((user) => {
        // Determine current context: persisted if valid, otherwise defaultContext
        const persistedContext = this.getPersistedContext();
        const isValid = user.contexts.some(
          (ctx) =>
            ctx.type === persistedContext?.type &&
            ctx.id === persistedContext?.id,
        );
        const currentContext = isValid ? persistedContext : user.defaultContext;

        // Persist the chosen context
        this.persistContext(currentContext);

        // Update state
        this._state.update((state) => ({
          ...state,
          user,
          currentContext,
          isLoading: false,
          token: this.tokenStorage.getToken(), // Sync token from storage
        }));

        // this.debugLog(
        //   '[AuthStore] User loaded:',
        //   user.email,
        //   'Context:',
        //   currentContext?.name,
        // );
      }),
      catchError((error) => {
        const problem = this.extractProblemDetails(error);

        this._state.update((state) => ({
          ...state,
          isLoading: false,
          lastError: problem,
        }));

        // this.debugLog('[AuthStore] Load user failed:', problem.title);

        // If 401, clear token
        if (problem.status === 401) {
          this.clearAuth();
        }

        return of(null);
      }),
    );
  }

  /**
   * Switch to a different context (must be in user.contexts)
   * Persists the choice to localStorage
   */
  switchContext(context: ContextDto): boolean {
    const user = this._state().user;
    if (!user) {
      // this.debugLog('[AuthStore] Cannot switch context: no user');
      return false;
    }

    // Validate context exists in user.contexts
    const isValid = user.contexts.some(
      (ctx) => ctx.type === context.type && ctx.id === context.id,
    );

    if (!isValid) {
      // this.debugLog('[AuthStore] Cannot switch: invalid context', context);
      return false;
    }

    // Update state
    this._state.update((state) => ({ ...state, currentContext: context }));

    // Persist to localStorage
    this.persistContext(context);

    // this.debugLog('[AuthStore] Context switched to:', context.name);
    return true;
  }

  /**
   * Logout: clear token, user, context, and redirect to home
   */
  logout(): void {
    this.clearAuth();
    this.router.navigate(['/']);
    // this.debugLog('[AuthStore] User logged out');
  }

  /**
   * Initialize auth on app load
   * Checks for valid token and loads user
   * Returns Observable<CurrentUserDto | null>
   */
  initialize(): Observable<CurrentUserDto | null> {
    if (!this.isBrowser || !this.tokenStorage.hasValidToken()) {
      // this.debugLog('[AuthStore] No valid token, skipping initialization');
      return of(null);
    }

    // this.debugLog('[AuthStore] Initializing with stored token');
    return this.loadMe();
  }

  /**
   * Clear all auth data (token, user, context)
   */
  private clearAuth(): void {
    this.tokenStorage.clearToken();
    this.clearPersistedContext();
    this._state.set(INITIAL_STATE);
  }

  /**
   * Persist currentContext to localStorage
   */
  private persistContext(context: ContextDto | null): void {
    if (!this.isBrowser || !context) return;

    try {
      localStorage.setItem(CURRENT_CONTEXT_KEY, JSON.stringify(context));
    } catch (e) {
      // this.debugLog('[AuthStore] Failed to persist context:', e);
    }
  }

  /**
   * Get persisted context from localStorage
   */
  private getPersistedContext(): ContextDto | null {
    if (!this.isBrowser) return null;

    try {
      const stored = localStorage.getItem(CURRENT_CONTEXT_KEY);
      return stored ? (JSON.parse(stored) as ContextDto) : null;
    } catch (e) {
      // this.debugLog('[AuthStore] Failed to parse persisted context:', e);
      return null;
    }
  }

  /**
   * Clear persisted context from localStorage
   */
  private clearPersistedContext(): void {
    if (!this.isBrowser) return;

    try {
      localStorage.removeItem(CURRENT_CONTEXT_KEY);
    } catch (e) {
      // this.debugLog('[AuthStore] Failed to clear context:', e);
    }
  }

  /**
   * Extract ProblemDetails from HTTP error response
   */
  private extractProblemDetails(error: unknown): ProblemDetails {
    if (
      error &&
      typeof error === 'object' &&
      'error' in error &&
      error.error &&
      typeof error.error === 'object'
    ) {
      const err = error.error as Partial<ProblemDetails>;
      if (err.type && err.title && err.status) {
        return err as ProblemDetails;
      }
    }

    // Fallback: generic error
    return {
      type: 'about:blank',
      title: 'Error inesperado',
      status: 500,
      detail: 'Ocurrió un error al cargar la sesión',
    };
  }
}
