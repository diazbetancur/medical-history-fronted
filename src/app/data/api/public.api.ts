import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import {
  CreateServiceRequestPayload,
  CreateServiceRequestResponse,
  HomePageResponse,
  MetadataResponse,
  ProfilePageResponse,
  SearchPageResponse,
  SearchParams,
  SuggestResponse,
} from './api-models';

/**
 * Public API Client
 * Handles public endpoints: /api/public/*
 * No authentication required
 */
@Injectable({ providedIn: 'root' })
export class PublicApi {
  private readonly api = inject(ApiClient);

  // ===========================================================================
  // Pages
  // ===========================================================================

  /**
   * GET /api/public/pages/home
   * Get home page data with featured content
   */
  getHomePage(): Observable<HomePageResponse> {
    return this.api.get<HomePageResponse>('/public/pages/home');
  }

  /**
   * GET /api/public/pages/search
   * Search professionals with filters and pagination
   */
  getSearchPage(params: SearchParams = {}): Observable<SearchPageResponse> {
    const queryParams = this.buildSearchParams(params);
    const queryString = queryParams.toString();
    const endpoint = `/public/pages/search${
      queryString ? `?${queryString}` : ''
    }`;
    return this.api.get<SearchPageResponse>(endpoint);
  }

  /**
   * GET /api/public/pages/profile/{slug}
   * Get professional profile detail
   */
  getProfilePage(slug: string): Observable<ProfilePageResponse> {
    return this.api.get<ProfilePageResponse>(
      `/public/pages/profile/${encodeURIComponent(slug)}`
    );
  }

  // ===========================================================================
  // Search / Typeahead
  // ===========================================================================

  /**
   * GET /api/public/search/suggest
   * Typeahead suggestions for search
   */
  suggest(query: string, limit = 10): Observable<SuggestResponse> {
    if (query.length < 2) {
      // API requires minimum 2 characters
      return new Observable((subscriber) => {
        subscriber.next({ professionals: [], categories: [], services: [] });
        subscriber.complete();
      });
    }
    const params = new URLSearchParams();
    params.set('q', query);
    params.set('limit', String(limit));
    return this.api.get<SuggestResponse>(
      `/public/search/suggest?${params.toString()}`
    );
  }

  // ===========================================================================
  // Metadata / Catalogs
  // ===========================================================================

  /**
   * GET /api/public/metadata
   * Get catalogs for dropdowns (countries, cities, categories)
   */
  getMetadata(): Observable<MetadataResponse> {
    return this.api.get<MetadataResponse>('/public/metadata');
  }

  // ===========================================================================
  // Service Requests
  // ===========================================================================

  /**
   * POST /api/public/requests
   * Create a contact request for a professional
   */
  createRequest(
    payload: CreateServiceRequestPayload
  ): Observable<CreateServiceRequestResponse> {
    return this.api.post<CreateServiceRequestResponse>(
      '/public/requests',
      payload
    );
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private buildSearchParams(params: SearchParams): URLSearchParams {
    const searchParams = new URLSearchParams();

    if (params.q) {
      searchParams.set('q', params.q);
    }
    if (params.category) {
      searchParams.set('category', params.category);
    }
    if (params.city) {
      searchParams.set('city', params.city);
    }
    if (params.country) {
      searchParams.set('country', params.country);
    }
    if (params.page && params.page > 1) {
      searchParams.set('page', String(params.page));
    }
    if (params.pageSize && params.pageSize !== 20) {
      searchParams.set('pageSize', String(params.pageSize));
    }

    return searchParams;
  }
}
