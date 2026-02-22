import { computed, inject, Injectable, signal } from '@angular/core';
import {
  getErrorMessage,
  PaginationMeta,
  ProfessionalApi,
  ProfessionalRequestsParams,
  RequestStatus,
  ServiceRequest,
} from '@data/api';
import { Observable, of } from 'rxjs';

export interface ProfessionalRequestsState {
  requests: ServiceRequest[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  currentParams: ProfessionalRequestsParams | null;
}

const initialState: ProfessionalRequestsState = {
  requests: [],
  pagination: null,
  loading: false,
  error: null,
  lastFetch: null,
  currentParams: null,
};

/**
 * Store for managing professional's service requests.
 * Uses real API via ProfessionalApi service.
 */
@Injectable({ providedIn: 'root' })
export class ProfessionalRequestsStore {
  private readonly professionalApi = inject(ProfessionalApi);

  // Private state
  private readonly _state = signal<ProfessionalRequestsState>(initialState);

  // Cache TTL (5 minutes)
  private readonly CACHE_TTL = 5 * 60 * 1000;

  // Public computed signals
  readonly state = this._state.asReadonly();
  readonly requests = computed(() => this._state().requests);
  readonly pagination = computed(() => this._state().pagination);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);

  // Filtered computed signals
  readonly pendingRequests = computed(() =>
    this._state().requests.filter((r) => r.status === 'Pending'),
  );
  readonly acceptedRequests = computed(() =>
    this._state().requests.filter((r) => r.status === 'Accepted'),
  );
  readonly completedRequests = computed(() =>
    this._state().requests.filter((r) => r.status === 'Completed'),
  );
  readonly rejectedRequests = computed(() =>
    this._state().requests.filter((r) => r.status === 'Rejected'),
  );

  // Counts
  readonly pendingCount = computed(() => this.pendingRequests().length);
  readonly acceptedCount = computed(() => this.acceptedRequests().length);
  readonly completedCount = computed(() => this.completedRequests().length);
  readonly rejectedCount = computed(() => this.rejectedRequests().length);
  readonly totalCount = computed(() => this._state().requests.length);

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    const lastFetch = this._state().lastFetch;
    if (!lastFetch) return false;
    return Date.now() - lastFetch < this.CACHE_TTL;
  }

  /**
   * Load requests with optional params
   */
  load(
    params: ProfessionalRequestsParams = {},
    forceRefresh = false,
  ): Observable<ServiceRequest[]> {
    // Return cached if valid and params match
    if (!forceRefresh && this.isCacheValid()) {
      const currentParams = this._state().currentParams;
      const paramsMatch =
        JSON.stringify(currentParams) === JSON.stringify(params);
      if (paramsMatch) {
        return of(this._state().requests);
      }
    }

    this._state.update((s) => ({
      ...s,
      loading: true,
      error: null,
      currentParams: params,
    }));

    return new Observable((subscriber) => {
      this.professionalApi.getRequests(params).subscribe({
        next: (response) => {
          const currentPage = response.page ?? params.page ?? 1;
          const currentPageSize = response.pageSize ?? params.pageSize ?? 20;
          const totalItems = response.totalCount ?? response.items.length;
          const totalPages =
            response.totalPages ?? Math.ceil(totalItems / currentPageSize);

          this._state.set({
            requests: response.items,
            pagination: {
              currentPage,
              pageSize: currentPageSize,
              totalItems,
              totalPages,
              hasPrevious: currentPage > 1,
              hasNext: currentPage < totalPages,
            },
            loading: false,
            error: null,
            lastFetch: Date.now(),
            currentParams: params,
          });
          subscriber.next(response.items);
          subscriber.complete();
        },
        error: (err) => {
          const errorMessage = getErrorMessage(err?.error ?? err);
          this._state.update((s) => ({
            ...s,
            loading: false,
            error: errorMessage,
          }));
          subscriber.error(err);
        },
      });
    });
  }

  /**
   * Update request status with optimistic update
   */
  updateStatus(
    requestId: string,
    status: Extract<RequestStatus, 'Accepted' | 'Completed' | 'Rejected'>,
    professionalNotes?: string,
  ): Observable<ServiceRequest> {
    // Optimistic update
    const previousRequests = this._state().requests;
    this._state.update((s) => ({
      ...s,
      requests: s.requests.map((r) =>
        r.id === requestId ? { ...r, status, professionalNotes } : r,
      ),
    }));

    return new Observable((subscriber) => {
      this.professionalApi
        .updateRequestStatus(requestId, { status, professionalNotes })
        .subscribe({
          next: (response) => {
            // Update with server response
            this._state.update((s) => ({
              ...s,
              requests: s.requests.map((r) =>
                r.id === requestId
                  ? {
                      ...r,
                      status: response.status,
                      professionalNotes: response.professionalNotes,
                      dateUpdated: response.dateUpdated,
                    }
                  : r,
              ),
            }));

            // Return the full updated request
            const updated = this._state().requests.find(
              (r) => r.id === requestId,
            );
            if (updated) {
              subscriber.next(updated);
            }
            subscriber.complete();
          },
          error: (err) => {
            // Rollback on error
            this._state.update((s) => ({
              ...s,
              requests: previousRequests,
              error: getErrorMessage(err?.error ?? err),
            }));
            subscriber.error(err);
          },
        });
    });
  }

  /**
   * Load next page
   */
  loadNextPage(): Observable<ServiceRequest[]> | null {
    const pagination = this.pagination();
    const currentParams = this._state().currentParams;

    if (!pagination || !pagination.hasNext) return null;

    return this.load(
      {
        ...currentParams,
        page: pagination.currentPage + 1,
      },
      true,
    );
  }

  /**
   * Clear cache and reset
   */
  reset(): void {
    this._state.set(initialState);
  }
}
