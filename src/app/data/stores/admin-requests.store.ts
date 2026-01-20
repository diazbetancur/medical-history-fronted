import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import {
  AdminApi,
  AdminRequestListItem,
  AdminRequestsParams,
  getErrorMessage,
  PaginationMeta,
} from '@data/api';

export interface AdminRequestsState {
  requests: AdminRequestListItem[];
  pagination: PaginationMeta | null;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  currentParams: AdminRequestsParams | null;
}

const initialState: AdminRequestsState = {
  requests: [],
  pagination: null,
  loading: false,
  error: null,
  lastFetch: null,
  currentParams: null,
};

/**
 * Store for admin service requests management.
 * Uses real API via AdminApi service.
 */
@Injectable({ providedIn: 'root' })
export class AdminRequestsStore {
  private readonly adminApi = inject(AdminApi);

  // Private state
  private readonly _state = signal<AdminRequestsState>(initialState);

  // Cache TTL (2 minutes for admin - more fresh data)
  private readonly CACHE_TTL = 2 * 60 * 1000;

  // Public computed signals
  readonly state = this._state.asReadonly();
  readonly requests = computed(() => this._state().requests);
  readonly pagination = computed(() => this._state().pagination);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);

  // Filtered computed signals
  readonly pendingRequests = computed(() =>
    this._state().requests.filter((r) => r.status === 'Pending')
  );
  readonly contactedRequests = computed(() =>
    this._state().requests.filter((r) => r.status === 'Contacted')
  );
  readonly inProgressRequests = computed(() =>
    this._state().requests.filter((r) => r.status === 'InProgress')
  );
  readonly completedRequests = computed(() =>
    this._state().requests.filter((r) => r.status === 'Completed')
  );
  readonly rejectedRequests = computed(() =>
    this._state().requests.filter((r) => r.status === 'Rejected')
  );
  readonly cancelledRequests = computed(() =>
    this._state().requests.filter((r) => r.status === 'Cancelled')
  );
  readonly closedRequests = computed(() =>
    this._state().requests.filter(
      (r) =>
        r.status === 'Completed' ||
        r.status === 'Rejected' ||
        r.status === 'Cancelled'
    )
  );

  // Counts
  readonly pendingCount = computed(() => this.pendingRequests().length);
  readonly contactedCount = computed(() => this.contactedRequests().length);
  readonly closedCount = computed(() => this.closedRequests().length);
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
   * Load all requests with optional params
   */
  load(
    params: AdminRequestsParams = {},
    forceRefresh = false
  ): Observable<AdminRequestListItem[]> {
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
      this.adminApi.getRequests(params).subscribe({
        next: (response) => {
          this._state.set({
            requests: response.data,
            pagination: response.pagination,
            loading: false,
            error: null,
            lastFetch: Date.now(),
            currentParams: params,
          });
          subscriber.next(response.data);
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
   * Reject a request with optimistic update
   */
  rejectRequest(
    requestId: string,
    adminNotes?: string
  ): Observable<AdminRequestListItem> {
    // Optimistic update
    const previousRequests = this._state().requests;
    this._state.update((s) => ({
      ...s,
      requests: s.requests.map((r) =>
        r.id === requestId
          ? { ...r, status: 'Rejected' as const, adminNotes }
          : r
      ),
    }));

    return new Observable((subscriber) => {
      this.adminApi
        .moderateRequest(requestId, { status: 'Rejected', adminNotes })
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
                      adminNotes: response.adminNotes,
                      dateUpdated: response.dateUpdated,
                    }
                  : r
              ),
            }));

            // Return the full updated request
            const updated = this._state().requests.find(
              (r) => r.id === requestId
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
   * Add admin notes to a request
   */
  addAdminNotes(
    requestId: string,
    adminNotes: string
  ): Observable<AdminRequestListItem> {
    const previousRequests = this._state().requests;
    this._state.update((s) => ({
      ...s,
      requests: s.requests.map((r) =>
        r.id === requestId ? { ...r, adminNotes } : r
      ),
    }));

    return new Observable((subscriber) => {
      this.adminApi.moderateRequest(requestId, { adminNotes }).subscribe({
        next: (response) => {
          this._state.update((s) => ({
            ...s,
            requests: s.requests.map((r) =>
              r.id === requestId
                ? {
                    ...r,
                    adminNotes: response.adminNotes,
                    dateUpdated: response.dateUpdated,
                  }
                : r
            ),
          }));

          const updated = this._state().requests.find(
            (r) => r.id === requestId
          );
          if (updated) {
            subscriber.next(updated);
          }
          subscriber.complete();
        },
        error: (err) => {
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
  loadNextPage(): Observable<AdminRequestListItem[]> | null {
    const pagination = this.pagination();
    const currentParams = this._state().currentParams;

    if (!pagination || !pagination.hasNext) return null;

    return this.load(
      {
        ...currentParams,
        page: pagination.currentPage + 1,
      },
      true
    );
  }

  /**
   * Clear cache and reset
   */
  reset(): void {
    this._state.set(initialState);
  }
}
