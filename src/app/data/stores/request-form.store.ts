import { isPlatformBrowser } from '@angular/common';
import {
  Injectable,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  CreateServiceRequestPayload,
  CreateServiceRequestResponse,
  ProblemDetails,
  PublicApi,
  getErrorMessage,
  hasFieldErrors,
} from '@data/api';
import { Observable, catchError, of, tap, throwError } from 'rxjs';

export interface RequestFormState {
  loading: boolean;
  success: boolean;
  error: string | null;
  fieldErrors: Record<string, string[]> | null;
  requestId: string | null;
  /** Tracks submitted request hashes to prevent duplicates */
  submittedHashes: Set<string>;
}

const initialState: RequestFormState = {
  loading: false,
  success: false,
  error: null,
  fieldErrors: null,
  requestId: null,
  submittedHashes: new Set(),
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
   * Generate a hash for duplicate detection
   */
  private generateRequestHash(payload: CreateServiceRequestPayload): string {
    const key = `${payload.profileId}|${payload.clientEmail}|${payload.message?.slice(0, 50)}`;
    return btoa(key);
  }

  /**
   * Check if a similar request was already submitted
   */
  isDuplicateRequest(payload: CreateServiceRequestPayload): boolean {
    const hash = this.generateRequestHash(payload);
    return this._state().submittedHashes.has(hash);
  }

  /**
   * Submit a service request
   * Includes duplicate prevention within the same session
   */
  submit(
    payload: CreateServiceRequestPayload,
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

    // Check for duplicate submission
    const requestHash = this.generateRequestHash(payload);
    if (this._state().submittedHashes.has(requestHash)) {
      this._state.update((s) => ({
        ...s,
        error:
          'Ya enviaste una solicitud similar. Por favor espera la respuesta del profesional.',
      }));
      return throwError(() => new Error('Duplicate request'));
    }

    this._state.update((s) => ({
      ...s,
      loading: true,
      success: false,
      error: null,
      fieldErrors: null,
      requestId: null,
    }));

    return this.publicApi.createRequest(payload).pipe(
      tap((response) => {
        // Add hash to prevent duplicate submissions
        const updatedHashes = new Set(this._state().submittedHashes);
        updatedHashes.add(requestHash);

        this._state.set({
          loading: false,
          success: true,
          error: null,
          fieldErrors: null,
          requestId: response.id,
          submittedHashes: updatedHashes,
        });
      }),
      catchError((err) => {
        const errorBody = err?.error;

        // Handle 409 Conflict (duplicate from server)
        if (err?.status === 409) {
          const updatedHashes = new Set(this._state().submittedHashes);
          updatedHashes.add(requestHash);

          this._state.update((s) => ({
            ...s,
            loading: false,
            error:
              'Ya existe una solicitud similar pendiente con este profesional.',
            submittedHashes: updatedHashes,
          }));
          throw err;
        }

        // Extract field errors if present (ProblemDetails format)
        let fieldErrors: Record<string, string[]> | null = null;
        if (hasFieldErrors(errorBody)) {
          fieldErrors = (errorBody as ProblemDetails).errors!;
        }

        const errorMessage = getErrorMessage(errorBody ?? err);

        this._state.update((s) => ({
          ...s,
          loading: false,
          success: false,
          error: errorMessage,
          fieldErrors,
          requestId: null,
        }));
        throw err;
      }),
    );
  }

  /**
   * Reset form state (keeps submittedHashes to prevent duplicates)
   */
  reset(): void {
    this._state.update((s) => ({
      ...initialState,
      submittedHashes: s.submittedHashes,
    }));
  }

  /**
   * Full reset including duplicate tracking (use on logout or page leave)
   */
  fullReset(): void {
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
