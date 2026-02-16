import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CreateServiceRequestPayload,
  CreateServiceRequestResponse,
  PaginatedResponse,
  ServiceRequest,
  ServiceRequestStatus,
  UpdateRequestStatusPayload,
} from '@data/models';
import { environment } from '@env';
import { Observable } from 'rxjs';

export interface RequestOptions {
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

/**
 * Base API client with typed methods.
 * Handles all HTTP communication with the backend.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * GET request with typed response
   */
  get<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    return this.http.get<T>(url, httpOptions);
  }

  /**
   * GET request for paginated data
   */
  getPaginated<T>(
    endpoint: string,
    page: number = 1,
    pageSize: number = 10,
    options?: RequestOptions,
  ): Observable<PaginatedResponse<T>> {
    const params = {
      ...options?.params,
      page,
      pageSize,
    };
    return this.get<PaginatedResponse<T>>(endpoint, { ...options, params });
  }

  /**
   * POST request with typed body and response
   */
  post<T, B = unknown>(
    endpoint: string,
    body: B,
    options?: RequestOptions,
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    return this.http.post<T>(url, body, httpOptions);
  }

  /**
   * PUT request with typed body and response
   */
  put<T, B = unknown>(
    endpoint: string,
    body: B,
    options?: RequestOptions,
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    return this.http.put<T>(url, body, httpOptions);
  }

  /**
   * PATCH request with typed body and response
   */
  patch<T, B = unknown>(
    endpoint: string,
    body: B,
    options?: RequestOptions,
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    return this.http.patch<T>(url, body, httpOptions);
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    const url = this.buildUrl(endpoint);
    const httpOptions = this.buildHttpOptions(options);
    return this.http.delete<T>(url, httpOptions);
  }

  /**
   * POST multipart/form-data request (for file uploads)
   */
  postMultipart<T>(
    endpoint: string,
    formData: FormData,
    options?: RequestOptions,
  ): Observable<T> {
    const url = this.buildUrl(endpoint);
    // Don't set Content-Type header - browser will set it with boundary
    const httpOptions = this.buildHttpOptions(options);
    return this.http.post<T>(url, formData, httpOptions);
  }

  /**
   * Build full URL from endpoint
   * Made public for special cases like file downloads
   */
  buildUrl(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/')
      ? endpoint.slice(1)
      : endpoint;
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  /**
   * Build HttpClient options from RequestOptions
   */
  private buildHttpOptions(options?: RequestOptions): {
    params?: HttpParams;
    headers?: HttpHeaders;
  } {
    const httpOptions: { params?: HttpParams; headers?: HttpHeaders } = {};

    if (options?.params) {
      let params = new HttpParams();
      Object.entries(options.params).forEach(([key, value]) => {
        params = params.set(key, String(value));
      });
      httpOptions.params = params;
    }

    if (options?.headers) {
      let headers = new HttpHeaders();
      Object.entries(options.headers).forEach(([key, value]) => {
        headers = headers.set(key, value);
      });
      httpOptions.headers = headers;
    }

    return httpOptions;
  }

  // ===========================================================================
  // Service Request API Methods
  // ===========================================================================

  /**
   * Create a service request (public - no auth required)
   */
  createPublicRequest(
    payload: CreateServiceRequestPayload,
  ): Observable<CreateServiceRequestResponse> {
    return this.post<CreateServiceRequestResponse, CreateServiceRequestPayload>(
      '/public/requests',
      payload,
    );
  }

  /**
   * Get professional's requests (requires professional auth)
   */
  getProfessionalRequests(): Observable<ServiceRequest[]> {
    return this.get<ServiceRequest[]>('/professional/requests');
  }

  /**
   * Update professional request status
   */
  updateProfessionalRequestStatus(
    requestId: string,
    status: Extract<ServiceRequestStatus, 'CONTACTED' | 'CLOSED'>,
  ): Observable<ServiceRequest> {
    return this.patch<ServiceRequest, UpdateRequestStatusPayload>(
      `/professional/requests/${requestId}`,
      { status },
    );
  }

  /**
   * Get all requests (admin)
   */
  getAdminRequests(): Observable<ServiceRequest[]> {
    return this.get<ServiceRequest[]>('/admin/requests');
  }

  /**
   * Update admin request status (reject)
   */
  updateAdminRequestStatus(
    requestId: string,
    status: Extract<ServiceRequestStatus, 'REJECTED'>,
  ): Observable<ServiceRequest> {
    return this.patch<ServiceRequest, UpdateRequestStatusPayload>(
      `/admin/requests/${requestId}`,
      { status },
    );
  }
}
