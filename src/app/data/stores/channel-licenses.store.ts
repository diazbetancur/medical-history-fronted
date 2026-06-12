import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import {
  ActivateLicenseDto,
  ChannelLicenseItemDto,
  ChannelLicenseListQuery,
  ChannelLicensesApi,
  ChannelPortfolioSummaryDto,
  DeactivateLicenseDto,
  LicensePlan,
  UpdateLicensePlanDto,
} from '../api/channel-licenses.api';

@Injectable({ providedIn: 'root' })
export class ChannelLicensesStore {
  private readonly api = inject(ChannelLicensesApi);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly licenses = signal<ChannelLicenseItemDto[]>([]);
  readonly summary = signal<ChannelPortfolioSummaryDto | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly totalCount = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly filterActive = signal<boolean | undefined>(undefined);
  readonly filterPlan = signal<LicensePlan | undefined>(undefined);

  readonly totalPages = computed(() => Math.ceil(this.totalCount() / this.pageSize()));

  // ── Queries ────────────────────────────────────────────────────────────────

  loadSummary(): void {
    this.api.getSummary().subscribe({
      next: (s) => this.summary.set(s),
    });
  }

  loadPortfolio(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: ChannelLicenseListQuery = {
      page: this.page(),
      pageSize: this.pageSize(),
      active: this.filterActive(),
      plan: this.filterPlan(),
    };

    this.api
      .getPortfolio(query)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          this.licenses.set(result.items);
          this.totalCount.set(result.totalCount);
        },
        error: (err: Error) => this.error.set(err.message),
      });
  }

  reload(): void {
    this.loadSummary();
    this.loadPortfolio();
  }

  setPage(page: number): void {
    this.page.set(page);
    this.loadPortfolio();
  }

  setPageSize(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
    this.loadPortfolio();
  }

  setFilterActive(active: boolean | undefined): void {
    this.filterActive.set(active);
    this.page.set(1);
    this.loadPortfolio();
  }

  setFilterPlan(plan: LicensePlan | undefined): void {
    this.filterPlan.set(plan);
    this.page.set(1);
    this.loadPortfolio();
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  activate(
    id: string,
    dto: ActivateLicenseDto,
    onSuccess: () => void,
    onError: (msg: string) => void,
  ): void {
    this.saving.set(true);
    this.api
      .activate(id, dto)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.reload();
          onSuccess();
        },
        error: (err: Error) => onError(err.message),
      });
  }

  deactivate(
    id: string,
    dto: DeactivateLicenseDto,
    onSuccess: () => void,
    onError: (msg: string) => void,
  ): void {
    this.saving.set(true);
    this.api
      .deactivate(id, dto)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.reload();
          onSuccess();
        },
        error: (err: Error) => onError(err.message),
      });
  }

  updatePlan(
    id: string,
    dto: UpdateLicensePlanDto,
    onSuccess: () => void,
    onError: (msg: string) => void,
  ): void {
    this.saving.set(true);
    this.api
      .updatePlan(id, dto)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.reload();
          onSuccess();
        },
        error: (err: Error) => onError(err.message),
      });
  }
}
