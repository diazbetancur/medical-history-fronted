import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import {
  CreateProfessionalProfilePayload,
  CreateServicePayload,
  ProfessionalDashboardResponse,
  ProfessionalProfile,
  ProfessionalRequestsParams,
  ProfessionalRequestsResponse,
  Service,
  UpdateProfessionalProfilePayload,
  UpdateRequestResponse,
  UpdateRequestStatusPayload,
  UpdateServicePayload,
} from './api-models';

/**
 * Professional API Client
 * Handles professional endpoints: /api/professional/*
 * Requires Professional or SuperAdmin role
 */
@Injectable({ providedIn: 'root' })
export class ProfessionalApi {
  private readonly api = inject(ApiClient);

  // ===========================================================================
  // Profile
  // ===========================================================================

  /**
   * GET /api/professional/profile
   * Get authenticated professional's profile
   */
  getProfile(): Observable<ProfessionalProfile> {
    return this.api.get<ProfessionalProfile>('/professional/profile');
  }

  /**
   * POST /api/professional/profile
   * Create professional profile (onboarding)
   */
  createProfile(
    payload: CreateProfessionalProfilePayload,
  ): Observable<ProfessionalProfile> {
    return this.api.post<ProfessionalProfile>('/professional/profile', payload);
  }

  /**
   * PUT /api/professional/profile
   * Update professional profile
   */
  updateProfile(
    payload: UpdateProfessionalProfilePayload,
  ): Observable<ProfessionalProfile> {
    return this.api.put<ProfessionalProfile>('/professional/profile', payload);
  }

  // ===========================================================================
  // Services
  // ===========================================================================

  /**
   * GET /api/professional/services
   * List all services for the authenticated professional
   */
  getServices(includeInactive = false): Observable<Service[]> {
    const params = includeInactive ? '?includeInactive=true' : '';
    return this.api.get<Service[]>(`/professional/services${params}`);
  }

  /**
   * POST /api/professional/services
   * Create a new service
   */
  createService(payload: CreateServicePayload): Observable<Service> {
    return this.api.post<Service>('/professional/services', payload);
  }

  /**
   * PUT /api/professional/services/{id}
   * Update an existing service
   */
  updateService(
    id: string,
    payload: UpdateServicePayload,
  ): Observable<Service> {
    return this.api.put<Service>(`/professional/services/${id}`, payload);
  }

  /**
   * DELETE /api/professional/services/{id}
   * Delete a service (soft delete - sets isActive=false)
   */
  deleteService(id: string): Observable<void> {
    return this.api.delete<void>(`/professional/services/${id}`);
  }

  // ===========================================================================
  // Requests
  // ===========================================================================

  /**
   * GET /api/professional/requests
   * List contact requests received by the professional
   */
  getRequests(
    params: ProfessionalRequestsParams = {},
  ): Observable<ProfessionalRequestsResponse> {
    const queryParams = this.buildRequestParams(params);
    const queryString = queryParams.toString();
    const endpoint = `/professional/requests${
      queryString ? `?${queryString}` : ''
    }`;
    return this.api.get<ProfessionalRequestsResponse>(endpoint);
  }

  /**
   * PATCH /api/professional/requests/{id}
   * Update request status
   */
  updateRequestStatus(
    id: string,
    payload: UpdateRequestStatusPayload,
  ): Observable<UpdateRequestResponse> {
    return this.api.patch<UpdateRequestResponse>(
      `/professional/requests/${id}`,
      payload,
    );
  }

  // ===========================================================================
  // Dashboard
  // ===========================================================================

  /**
   * GET /api/professional/dashboard/{professionalProfileId}
   * Returns aggregated dashboard metrics for the professional.
   * Policy: Profiles.View
   */
  getDashboard(
    professionalProfileId: string,
  ): Observable<ProfessionalDashboardResponse> {
    return this.api.get<ProfessionalDashboardResponse>(
      `/professional/dashboard/${professionalProfileId}`,
    );
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private buildRequestParams(
    params: ProfessionalRequestsParams,
  ): URLSearchParams {
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
