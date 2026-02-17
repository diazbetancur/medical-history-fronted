import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import {
  AdminCatalogsResponse,
  AdminDashboardSummaryResponse,
  AdminProfessionalDetail,
  AdminProfessionalsParams,
  AdminProfessionalsResponse,
  AdminRequestsParams,
  AdminRequestsResponse,
  ModerateProfilePayload,
  ModerateProfileResponse,
  ModerateRequestPayload,
  ModerateRequestResponse,
  ModerateServicePayload,
  Service,
} from './api-models';

/**
 * Admin API Client
 * Handles admin endpoints: /api/admin/*
 * Requires Admin or SuperAdmin role
 */
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly api = inject(ApiClient);

  // ===========================================================================
  // Professionals
  // ===========================================================================

  /**
   * GET /api/admin/professionals
   * List all professional profiles with filters
   */
  getProfessionals(
    params: AdminProfessionalsParams = {},
  ): Observable<AdminProfessionalsResponse> {
    const queryParams = this.buildProfessionalsParams(params);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? '/admin/professionals?' + queryString
      : '/admin/professionals';
    return this.api.get<AdminProfessionalsResponse>(endpoint);
  }

  /**
   * GET /api/admin/professionals/{id}
   * Get detailed professional profile for review
   */
  getProfessional(id: string): Observable<AdminProfessionalDetail> {
    return this.api.get<AdminProfessionalDetail>(`/admin/professionals/${id}`);
  }

  /**
   * PATCH /api/admin/professionals/{id}
   * Moderate a professional profile (verify, feature, disable)
   */
  moderateProfile(
    id: string,
    payload: ModerateProfilePayload,
  ): Observable<ModerateProfileResponse> {
    return this.api.patch<ModerateProfileResponse>(
      `/admin/professionals/${id}`,
      payload,
    );
  }

  // ===========================================================================
  // Services
  // ===========================================================================

  /**
   * PATCH /api/admin/services/{id}
   * Moderate a service (disable inappropriate content)
   */
  moderateService(
    id: string,
    payload: ModerateServicePayload,
  ): Observable<Service> {
    return this.api.patch<Service>(`/admin/services/${id}`, payload);
  }

  // ===========================================================================
  // Requests
  // ===========================================================================

  /**
   * GET /api/admin/requests
   * List all service requests
   */
  getRequests(
    params: AdminRequestsParams = {},
  ): Observable<AdminRequestsResponse> {
    const queryParams = this.buildRequestsParams(params);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? '/admin/requests?' + queryString
      : '/admin/requests';
    return this.api.get<AdminRequestsResponse>(endpoint);
  }

  /**
   * PATCH /api/admin/requests/{id}
   * Moderate a request (reject, add notes)
   */
  moderateRequest(
    id: string,
    payload: ModerateRequestPayload,
  ): Observable<ModerateRequestResponse> {
    return this.api.patch<ModerateRequestResponse>(
      `/admin/requests/${id}`,
      payload,
    );
  }

  // ===========================================================================
  // Catalogs
  // ===========================================================================

  /**
   * GET /api/admin/catalogs
   * Get catalogs with statistics (includes inactive items)
   */
  getCatalogs(): Observable<AdminCatalogsResponse> {
    return this.api.get<AdminCatalogsResponse>('/admin/catalogs');
  }

  /**
   * GET /api/admin/dashboard/summary
   * Get dashboard KPI summary for admin area
   */
  getDashboardSummary(): Observable<AdminDashboardSummaryResponse> {
    return this.api.get<AdminDashboardSummaryResponse>(
      '/admin/dashboard/summary',
    );
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private buildProfessionalsParams(
    params: AdminProfessionalsParams,
  ): URLSearchParams {
    const searchParams = new URLSearchParams();

    if (params.status && params.status !== 'all') {
      searchParams.set('status', params.status);
    }
    if (params.countryId) {
      searchParams.set('countryId', params.countryId);
    }
    if (params.cityId) {
      searchParams.set('cityId', params.cityId);
    }
    if (params.categoryId) {
      searchParams.set('categoryId', params.categoryId);
    }
    if (params.q) {
      searchParams.set('q', params.q);
    }
    if (params.orderBy && params.orderBy !== 'dateCreated') {
      searchParams.set('orderBy', params.orderBy);
    }
    if (params.page && params.page > 1) {
      searchParams.set('page', String(params.page));
    }
    if (params.pageSize && params.pageSize !== 20) {
      searchParams.set('pageSize', String(params.pageSize));
    }

    return searchParams;
  }

  private buildRequestsParams(params: AdminRequestsParams): URLSearchParams {
    const searchParams = new URLSearchParams();

    if (params.page && params.page > 1) {
      searchParams.set('page', String(params.page));
    }
    if (params.pageSize && params.pageSize !== 20) {
      searchParams.set('pageSize', String(params.pageSize));
    }
    if (params.status) {
      searchParams.set('status', params.status);
    }
    if (params.from) {
      searchParams.set('from', params.from);
    }
    if (params.to) {
      searchParams.set('to', params.to);
    }

    return searchParams;
  }
}
