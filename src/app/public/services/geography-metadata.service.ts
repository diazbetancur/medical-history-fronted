import { computed, inject, Injectable, signal } from '@angular/core';
import { ApiError, createApiError, isApiError } from '@core/http/api-error';
import { City, Country, Department, MetadataResponse, PublicApi } from '@data/api';
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

export type GeographyLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface GeographyMetadataState {
  status: GeographyLoadStatus;
  error: string | null;
  hondurasCountry: Country | null;
  hondurasCountryId: string | null;
  hondurasDepartments: Department[];
}

const INITIAL_STATE: GeographyMetadataState = {
  status: 'idle',
  error: null,
  hondurasCountry: null,
  hondurasCountryId: null,
  hondurasDepartments: [],
};

@Injectable({
  providedIn: 'root',
})
export class GeographyMetadataService {
  private readonly publicApi = inject(PublicApi);

  private readonly _state = signal<GeographyMetadataState>(INITIAL_STATE);
  private loadHondurasInFlight$: Observable<void> | null = null;
  private readonly departmentCitiesCache = new Map<string, City[]>();
  private readonly departmentCitiesInFlight = new Map<string, Observable<City[]>>();

  readonly state = this._state.asReadonly();
  readonly status = computed(() => this._state().status);
  readonly error = computed(() => this._state().error);
  readonly hondurasCountry = computed(() => this._state().hondurasCountry);
  readonly hondurasCountryId = computed(() => this._state().hondurasCountryId);
  readonly hondurasDepartments = computed(() => this._state().hondurasDepartments);

  loadHondurasGeographyIfNeeded(): Observable<void> {
    if (this.hasCompleteHondurasMetadata(this._state())) {
      return of(void 0);
    }

    if (this.loadHondurasInFlight$) {
      return this.loadHondurasInFlight$;
    }

    this._state.update((state) => ({
      ...state,
      status: 'loading',
      error: null,
    }));

    const request$ = this.publicApi.getMetadata().pipe(
      map((metadata) => this.resolveHondurasCountry(metadata)),
      switchMap((country) =>
        this.publicApi.getDepartmentsByCountry(country.id).pipe(
          map((departments) => ({ country, departments: departments ?? [] })),
        ),
      ),
      map(({ country, departments }) => {
        if (!departments.length) {
          throw this.createControlledError(
            404,
            'NOT_FOUND',
            'No se pudieron cargar los departamentos de Honduras.',
          );
        }

        return { country, departments };
      }),
      tap(({ country, departments }) => {
        this._state.set({
          status: 'loaded',
          error: null,
          hondurasCountry: country,
          hondurasCountryId: country.id,
          hondurasDepartments: departments,
        });
      }),
      map(() => void 0),
      catchError((error) => {
        const apiError = isApiError(error) ? error : createApiError(error);

        this._state.set({
          ...INITIAL_STATE,
          status: 'error',
          error: apiError.message || 'No se pudo preparar la metadata geográfica de Honduras.',
        });

        console.error(
          '[GeographyMetadataService] Failed to load Honduras geography metadata.',
          apiError,
        );

        return throwError(() => apiError);
      }),
      finalize(() => {
        this.loadHondurasInFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.loadHondurasInFlight$ = request$;
    return request$;
  }

  getHondurasCountry(): Country | null {
    return this._state().hondurasCountry;
  }

  getHondurasCountryId(): string | null {
    return this._state().hondurasCountryId;
  }

  getHondurasDepartments(): Department[] {
    return [...this._state().hondurasDepartments];
  }

  getCitiesByDepartment(departmentId: string): Observable<City[]> {
    const normalizedDepartmentId = departmentId.trim();

    if (!normalizedDepartmentId) {
      return throwError(() =>
        this.createControlledError(
          400,
          'BAD_REQUEST',
          'departmentId es requerido para cargar ciudades.',
        ),
      );
    }

    const cachedCities = this.departmentCitiesCache.get(normalizedDepartmentId);
    if (cachedCities) {
      return of(cachedCities);
    }

    const inFlightCities = this.departmentCitiesInFlight.get(normalizedDepartmentId);
    if (inFlightCities) {
      return inFlightCities;
    }

    const request$ = this.publicApi.getCitiesByDepartment(normalizedDepartmentId).pipe(
      map((cities) => cities ?? []),
      tap((cities) => {
        this.departmentCitiesCache.set(normalizedDepartmentId, cities);
      }),
      catchError((error) => {
        const apiError = isApiError(error) ? error : createApiError(error);

        console.error(
          '[GeographyMetadataService] Failed to load cities by department.',
          { departmentId: normalizedDepartmentId, error: apiError },
        );

        return throwError(() => apiError);
      }),
      finalize(() => {
        this.departmentCitiesInFlight.delete(normalizedDepartmentId);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.departmentCitiesInFlight.set(normalizedDepartmentId, request$);
    return request$;
  }

  private hasCompleteHondurasMetadata(
    state: GeographyMetadataState,
  ): boolean {
    return !!state.hondurasCountry && !!state.hondurasCountryId && state.hondurasDepartments.length > 0;
  }

  private resolveHondurasCountry(metadata: MetadataResponse): Country {
    if (!Array.isArray(metadata?.countries) || metadata.countries.length === 0) {
      throw this.createControlledError(
        400,
        'BAD_REQUEST',
        'La metadata pública no incluyó países válidos.',
        metadata,
      );
    }

    const byIso2 = metadata.countries.find(
      (country) => country.iso2?.trim().toUpperCase() === 'HN',
    );
    if (byIso2) {
      return byIso2;
    }

    const bySlug = metadata.countries.find(
      (country) => country.slug?.trim().toLowerCase() === 'honduras',
    );
    if (bySlug) {
      return bySlug;
    }

    const byName = metadata.countries.find(
      (country) => country.name?.trim() === 'Honduras',
    );
    if (byName) {
      return byName;
    }

    throw this.createControlledError(
      404,
      'NOT_FOUND',
      'No se encontró Honduras en la metadata pública.',
      metadata.countries,
    );
  }

  private createControlledError(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ): ApiError {
    return {
      status,
      code,
      message,
      traceId: null,
      details,
    };
  }
}