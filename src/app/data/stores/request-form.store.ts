import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import {
  CreateServiceRequestPayload,
  CreateServiceRequestResponse,
  getErrorMessage,
  hasFieldErrors,
  ProblemDetails,
  PublicApi,
} from '@data/api';

export interface RequestFormState {
  loading: boolean;
  success: boolean;
  error: string | null;
  fieldErrors: Record<string, string[]> | null;
  requestId: string | null;
}

const initialState: RequestFormState = {
  loading: false,
  success: false,
  error: null,
  fieldErrors: null,
  requestId: null,
};

/**
 * Store for managing public service request form.
 * SSR-safe: only submits in browser.
 * Uses real API via PublicApi service.
 */
@Injectable({ providedIn: 'root' })
export class RequestFormStore {
  private readonly publicApi = inject(PublicApi);
  private readonly platformId = inject(PLATFORM_ID);

  // Private state
  private readonly _state = signal<RequestFormState>(initialState);

  // Public computed signals
  readonly state = this._state.asReadonly();
  readonly loading = computed(() => this._state().loading);
  readonly success = computed(() => this._state().success);
  readonly error = computed(() => this._state().error);
  readonly fieldErrors = computed(() => this._state().fieldErrors);
  readonly requestId = computed(() => this._state().requestId);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Get error for specific field (for form validation)
   */
  getFieldError(field: string): string | null {
    const errors = this._state().fieldErrors;
    if (!errors || !errors[field] || errors[field].length === 0) {
      return null;
    }
    return errors[field][0];
  }

  /**
   * Submit a service request
   */
  submit(
    payload: CreateServiceRequestPayload
  ): Observable<CreateServiceRequestResponse> {
    // Only submit in browser
    if (!this.isBrowser) {
      return of({
        id: '',
        profileId: payload.profileId,
        status: 'Pending' as const,
        dateCreated: new Date().toISOString(),
        message: '',
      });
    }

    this._state.set({
      loading: true,
      success: false,
      error: null,
      fieldErrors: null,
      requestId: null,
    });

    return this.publicApi.createRequest(payload).pipe(
      tap((response) => {
        this._state.set({
          loading: false,
          success: true,
          error: null,
          fieldErrors: null,
          requestId: response.id,
        });
      }),
      catchError((err) => {
        const errorBody = err?.error;

        // Extract field errors if present (ProblemDetails format)
        let fieldErrors: Record<string, string[]> | null = null;
        if (hasFieldErrors(errorBody)) {
          fieldErrors = (errorBody as ProblemDetails).errors!;
        }

        const errorMessage = getErrorMessage(errorBody ?? err);

        this._state.set({
          loading: false,
          success: false,
          error: errorMessage,
          fieldErrors,
          requestId: null,
        });
        throw err;
      })
    );
  }

  /**
   * Reset form state
   */
  reset(): void {
    this._state.set(initialState);
  }

  /**
   * Clear only error state (keep other state)
   */
  clearError(): void {
    this._state.update((s) => ({
      ...s,
      error: null,
      fieldErrors: null,
    }));
  }
}
