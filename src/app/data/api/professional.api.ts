import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import {
  AssignProfessionalSpecialtiesPayload,
  CreateProfessionalAvailabilityExceptionPayload,
  CreateProfessionalEducationPayload,
  CreateProfessionalLocationPayload,
  CreateProfessionalProfilePayload,
  CreateServicePayload,
  ProfessionalAvailabilityException,
  ProfessionalAvailabilitySlotsResponse,
  ProfessionalAvailabilityTemplateResponse,
  ProfessionalDashboardResponse,
  ProfessionalEducationDetail,
  ProfessionalEducationSummary,
  ProfessionalLocation,
  ProfessionalProfile,
  ProfessionalProfilePhotoResponse,
  ProfessionalRequestsParams,
  ProfessionalRequestsResponse,
  ProfessionalSetDefaultLocationResponse,
  ProfessionalSpecialty,
  ProfessionalSpecialtyProposal,
  ProposeProfessionalSpecialtyPayload,
  Service,
  UpdateProfessionalEducationPayload,
  UpdateProfessionalLocationPayload,
  UpdateProfessionalProfilePayload,
  UpdateRequestResponse,
  UpdateRequestStatusPayload,
  UpdateServicePayload,
  UpsertProfessionalAvailabilityTemplatePayload,
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

  uploadProfilePhoto(
    photo: File,
  ): Observable<ProfessionalProfilePhotoResponse> {
    const formData = new FormData();
    formData.append('photo', photo);
    return this.api.postMultipart<ProfessionalProfilePhotoResponse>(
      '/professional/profile/photo',
      formData,
    );
  }

  deleteProfilePhoto(): Observable<void> {
    return this.api.delete<void>('/professional/profile/photo');
  }

  // ===========================================================================
  // Specialties
  // ===========================================================================

  getSpecialties(): Observable<ProfessionalSpecialty[]> {
    return this.api.get<ProfessionalSpecialty[]>('/professional/specialties');
  }

  assignSpecialties(
    payload: AssignProfessionalSpecialtiesPayload,
  ): Observable<ProfessionalSpecialty[]> {
    return this.api.put<ProfessionalSpecialty[]>(
      '/professional/specialties',
      payload,
    );
  }

  getSpecialtyProposals(): Observable<ProfessionalSpecialtyProposal[]> {
    return this.api.get<ProfessionalSpecialtyProposal[]>(
      '/professional/specialties/proposals',
    );
  }

  createSpecialtyProposal(
    payload: ProposeProfessionalSpecialtyPayload,
  ): Observable<ProfessionalSpecialtyProposal> {
    return this.api.post<ProfessionalSpecialtyProposal>(
      '/professional/specialties/proposals',
      payload,
    );
  }

  // ===========================================================================
  // Education
  // ===========================================================================

  getEducation(): Observable<ProfessionalEducationSummary[]> {
    return this.api.get<ProfessionalEducationSummary[]>(
      '/professional/education',
    );
  }

  getEducationById(id: string): Observable<ProfessionalEducationDetail> {
    return this.api.get<ProfessionalEducationDetail>(
      `/professional/education/${id}`,
    );
  }

  createEducation(
    payload: CreateProfessionalEducationPayload,
  ): Observable<ProfessionalEducationSummary> {
    return this.api.post<ProfessionalEducationSummary>(
      '/professional/education',
      payload,
    );
  }

  updateEducation(
    id: string,
    payload: UpdateProfessionalEducationPayload,
  ): Observable<ProfessionalEducationSummary> {
    return this.api.put<ProfessionalEducationSummary>(
      `/professional/education/${id}`,
      payload,
    );
  }

  deleteEducation(id: string): Observable<void> {
    return this.api.delete<void>(`/professional/education/${id}`);
  }

  uploadEducationDiploma(
    id: string,
    file: File,
  ): Observable<{ message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.postMultipart<{ message: string }>(
      `/professional/education/${id}/diploma`,
      formData,
    );
  }

  deleteEducationDiploma(id: string): Observable<void> {
    return this.api.delete<void>(`/professional/education/${id}/diploma`);
  }

  // ===========================================================================
  // Locations
  // ===========================================================================

  getLocations(all = false): Observable<ProfessionalLocation[]> {
    return this.api.get<ProfessionalLocation[]>('/professional/locations', {
      params: { all },
    });
  }

  createLocation(
    payload: CreateProfessionalLocationPayload,
  ): Observable<ProfessionalLocation> {
    return this.api.post<ProfessionalLocation>(
      '/professional/locations',
      payload,
    );
  }

  updateLocation(
    id: string,
    payload: UpdateProfessionalLocationPayload,
  ): Observable<ProfessionalLocation> {
    return this.api.put<ProfessionalLocation>(
      `/professional/locations/${id}`,
      payload,
    );
  }

  setDefaultLocation(
    id: string,
  ): Observable<ProfessionalSetDefaultLocationResponse> {
    return this.api.patch<ProfessionalSetDefaultLocationResponse>(
      `/professional/locations/${id}/set-default`,
      {},
    );
  }

  deleteLocation(id: string): Observable<void> {
    return this.api.delete<void>(`/professional/locations/${id}`);
  }

  // ===========================================================================
  // Availability
  // ===========================================================================

  getAvailabilityTemplate(
    professionalProfileId: string,
  ): Observable<ProfessionalAvailabilityTemplateResponse> {
    return this.api.get<ProfessionalAvailabilityTemplateResponse>(
      `/professional/${professionalProfileId}/availability/template`,
    );
  }

  upsertAvailabilityTemplate(
    professionalProfileId: string,
    payload: UpsertProfessionalAvailabilityTemplatePayload,
  ): Observable<ProfessionalAvailabilityTemplateResponse> {
    return this.api.put<ProfessionalAvailabilityTemplateResponse>(
      `/professional/${professionalProfileId}/availability/template`,
      payload,
    );
  }

  getAvailabilityExceptions(
    professionalProfileId: string,
    params?: { from?: string; to?: string; type?: 'Absent' | 'Override' },
  ): Observable<ProfessionalAvailabilityException[]> {
    return this.api.get<ProfessionalAvailabilityException[]>(
      `/professional/${professionalProfileId}/availability/exceptions`,
      { params: params ?? {} },
    );
  }

  createAvailabilityException(
    professionalProfileId: string,
    payload: CreateProfessionalAvailabilityExceptionPayload,
  ): Observable<ProfessionalAvailabilityException> {
    return this.api.post<ProfessionalAvailabilityException>(
      `/professional/${professionalProfileId}/availability/exceptions`,
      payload,
    );
  }

  deleteAvailabilityException(
    professionalProfileId: string,
    exceptionId: string,
  ): Observable<void> {
    return this.api.delete<void>(
      `/professional/${professionalProfileId}/availability/exceptions/${exceptionId}`,
    );
  }

  getAvailabilitySlots(
    professionalProfileId: string,
    date: string,
    durationMinutes?: number,
  ): Observable<ProfessionalAvailabilitySlotsResponse> {
    return this.api.get<ProfessionalAvailabilitySlotsResponse>(
      `/professional/${professionalProfileId}/availability/slots`,
      {
        params: {
          date,
          ...(durationMinutes ? { durationMinutes } : {}),
        },
      },
    );
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
    if (params.status !== undefined && params.status !== null) {
      searchParams.set('status', String(params.status));
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
