import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiClient } from './api-client';

// ── DTOs ─────────────────────────────────────────────────────────────────────

export type LicensePlan = 'Standard' | 'Growth';

export interface ChannelLicenseItemDto {
  professionalProfileId: string;
  userId: string;
  businessName: string;
  email: string | null;
  channel: string;
  plan: LicensePlan;
  licenseActive: boolean;
  licenseActivatedAt: string | null;
  licenseDeactivatedAt: string | null;
  isVerified: boolean;
}

export interface ChannelPortfolioSummaryDto {
  channel: string;
  totalLicenses: number;
  activeLicenses: number;
  inactiveLicenses: number;
  standardLicenses: number;
  growthLicenses: number;
}

export interface LicensePagedResult {
  items: ChannelLicenseItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ChannelLicenseListQuery {
  active?: boolean;
  plan?: LicensePlan;
  page?: number;
  pageSize?: number;
}

export interface ActivateLicenseDto {
  plan: LicensePlan;
}

export interface DeactivateLicenseDto {
  reason?: string;
}

export interface UpdateLicensePlanDto {
  plan: LicensePlan;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ChannelLicensesApi {
  private readonly api = inject(ApiClient);
  private readonly base = '/channel/licenses';

  getSummary(): Observable<ChannelPortfolioSummaryDto> {
    return this.api
      .get<ChannelPortfolioSummaryDto>(`${this.base}/summary`)
      .pipe(catchError(this.handleError));
  }

  getPortfolio(query: ChannelLicenseListQuery = {}): Observable<LicensePagedResult> {
    const params: Record<string, string | number | boolean> = {};
    if (query.active !== undefined) params['active'] = query.active;
    if (query.plan) params['plan'] = query.plan;
    if (query.page) params['page'] = query.page;
    if (query.pageSize) params['pageSize'] = query.pageSize;

    return this.api
      .get<LicensePagedResult>(this.base, { params })
      .pipe(catchError(this.handleError));
  }

  activate(id: string, dto: ActivateLicenseDto): Observable<void> {
    return this.api
      .post<void, ActivateLicenseDto>(`${this.base}/${id}/activate`, dto)
      .pipe(catchError(this.handleError));
  }

  deactivate(id: string, dto: DeactivateLicenseDto): Observable<void> {
    return this.api
      .post<void, DeactivateLicenseDto>(`${this.base}/${id}/deactivate`, dto)
      .pipe(catchError(this.handleError));
  }

  updatePlan(id: string, dto: UpdateLicensePlanDto): Observable<void> {
    return this.api
      .patch<void, UpdateLicensePlanDto>(`${this.base}/${id}/plan`, dto)
      .pipe(catchError(this.handleError));
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    const message =
      err.error?.detail ?? err.error?.title ?? err.message ?? 'Error inesperado';
    return throwError(() => new Error(message));
  }
}
