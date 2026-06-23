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
import { ToastService } from '@shared/services/toast.service';
import { catchError, Observable, of, tap } from 'rxjs';
import { CsrfTokenStore } from './csrf-token.store';
import { TokenStorage } from './token-storage.service';

const CURRENT_CONTEXT_KEY = 'auth_current_context';

export interface AuthState {
  token: string | null;
  user: CurrentUserDto | null;
  currentContext: ContextDto | null;
  isLoading: boolean;
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
 * Manages user session and context switching.
 * Auth token lives in an httpOnly cookie — JS never reads it directly.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly authApi = inject(AuthApi);
  private readonly tokenStorage = inject(TokenStorage);
  private readonly csrf = inject(CsrfTokenStore);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly toast = inject(ToastService);

  private readonly _state = signal<AuthState>(INITIAL_STATE);

  readonly state = this._state.asReadonly();
  readonly token = computed(() => this._state().token);
  readonly user = computed(() => this._state().user);
  readonly currentContext = computed(() => this._state().currentContext);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly lastError = computed(() => this._state().lastError);

  readonly isAuthenticated = computed(() => !!this._state().user);
  readonly userId = computed(() => this._state().user?.id ?? null);
  readonly userName = computed(() => this._state().user?.name ?? null);
  readonly userEmail = computed(() => this._state().user?.email ?? null);
  readonly userRoles = computed(() => this._state().user?.roles ?? []);
  readonly userPermissions = computed(() => this._state().user?.permissions ?? []);
  readonly availableContexts = computed(() => this._state().user?.contexts ?? []);
  readonly licenseLapsed = computed(() => this._state().user?.licenseLapsed ?? false);

  hasPermission(permission: string): boolean {
    return this.userPermissions().includes(permission);
  }

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * No-op: token is managed as an httpOnly cookie by the backend.
   * Kept for call-site compatibility.
   */
  setToken(_token: string, _expiresAt: string): void {
    // Token is managed as an httpOnly cookie by the backend — nothing to do here
  }

  /**
   * Load current user from /api/auth/me.
   * The httpOnly cookie is sent automatically by the browser.
   */
  loadMe(): Observable<CurrentUserDto | null> {
    this._state.update((state) => ({ ...state, isLoading: true, lastError: null }));

    return this.authApi.me().pipe(
      tap((user) => {
        // Restore the anti-CSRF token for this session (issued in the JWT and
        // echoed back in the /me body) so mutating requests can carry the header.
        this.csrf.set(user.csrfToken ?? null);

        const persistedContext = this.getPersistedContext();
        const isValid = user.contexts.some(
          (ctx) => ctx.type === persistedContext?.type && ctx.id === persistedContext?.id,
        );
        const currentContext = isValid ? persistedContext : user.defaultContext;

        this.persistContext(currentContext);

        this._state.update((state) => ({
          ...state,
          user,
          currentContext,
          isLoading: false,
          token: null, // token is in httpOnly cookie — not readable from JS
        }));
      }),
      catchError((error) => {
        const problem = this.extractProblemDetails(error);

        this._state.update((state) => ({ ...state, isLoading: false, lastError: problem }));

        if (problem.status === 401) {
          this.clearAuth();
        }

        return of(null);
      }),
    );
  }

  switchContext(context: ContextDto): boolean {
    const user = this._state().user;
    if (!user) return false;

    const isValid = user.contexts.some(
      (ctx) => ctx.type === context.type && ctx.id === context.id,
    );

    if (!isValid) return false;

    this._state.update((state) => ({ ...state, currentContext: context }));
    this.persistContext(context);
    return true;
  }

  /**
   * Logout: clear local state immediately, then ask backend to clear the cookie.
   */
  logout(): void {
    this.clearAuth();
    this.authApi.logout().subscribe();
    this.toast.info(
      'Sesión cerrada. Para continuar, inicia sesión desde el botón "Iniciar Sesión" en el inicio.',
    );
    this.router.navigate(['/']);
  }

  resetForLogin(): void {
    this.clearAuth();
  }

  expireSession(): void {
    this.clearAuth();
  }

  /**
   * Initialize auth on app load.
   *
   * The session lives in an httpOnly cookie that JS can't read, so we can't tell
   * directly whether a session exists. Instead we rely on the context marker that
   * is persisted on login and cleared on logout/401: if it's absent there is no
   * session to restore, so we skip the /me probe entirely — this avoids the noisy
   * 401 in the console for anonymous visitors. If the cookie ever outlives the
   * marker, the user simply logs in again.
   */
  initialize(): Observable<CurrentUserDto | null> {
    if (!this.isBrowser) return of(null);
    if (!this.getPersistedContext()) return of(null);
    return this.loadMe();
  }

  private clearAuth(): void {
    this.tokenStorage.clearToken();
    this.csrf.clear();
    this.clearPersistedContext();
    this._state.set(INITIAL_STATE);
  }

  private persistContext(context: ContextDto | null): void {
    if (!this.isBrowser || !context) return;
    try {
      localStorage.setItem(CURRENT_CONTEXT_KEY, JSON.stringify(context));
    } catch {
      // localStorage unavailable (e.g. private mode quota exceeded) — not critical
    }
  }

  private getPersistedContext(): ContextDto | null {
    if (!this.isBrowser) return null;
    try {
      const stored = localStorage.getItem(CURRENT_CONTEXT_KEY);
      return stored ? (JSON.parse(stored) as ContextDto) : null;
    } catch {
      return null;
    }
  }

  private clearPersistedContext(): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(CURRENT_CONTEXT_KEY);
    } catch {
      // ignore
    }
  }

  private extractProblemDetails(error: unknown): ProblemDetails {
    if (
      error &&
      typeof error === 'object' &&
      'error' in error &&
      error.error &&
      typeof error.error === 'object'
    ) {
      const err = error.error as Partial<ProblemDetails>;
      if (err.type && err.title && typeof err.status === 'number') {
        return err as ProblemDetails;
      }
    }

    return {
      type: 'about:blank',
      title: 'Error de conexión',
      status: 0,
      detail: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
    };
  }
}
