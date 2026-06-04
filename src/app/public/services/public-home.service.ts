import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HomePageResponse, MetadataResponse, PublicApi } from '@data/api';
import { catchError, forkJoin, map, Observable, of, tap } from 'rxjs';
import {
  PublicHomeDataDto,
  PublicHomeProfessionalCardDto,
  PublicHomeSpecialtyDto,
  PublicHomeStatsDto,
} from '../models/public-home.dto';

const STATS_MAX_KEY = 'home_stats_max';

@Injectable({
  providedIn: 'root',
})
export class PublicHomeService {
  private readonly publicApi = inject(PublicApi);
  private readonly platformId = inject(PLATFORM_ID);

  private homeCache: { data: PublicHomeDataDto; timestamp: number } | null =
    null;

  private readonly HOME_TTL = 10 * 60 * 1000;

  getHomeData(
    featuredLimit = 8,
    popularCitiesLimit = 6,
  ): Observable<PublicHomeDataDto> {
    if (
      this.homeCache &&
      Date.now() - this.homeCache.timestamp < this.HOME_TTL
    ) {
      return of(this.homeCache.data);
    }

    return forkJoin({
      home: this.publicApi
        .getHomePage(featuredLimit, popularCitiesLimit)
        .pipe(catchError(() => of(null))),
      metadata: this.publicApi
        .getMetadata()
        .pipe(
          catchError(() =>
            of({ countries: [], cities: [] } as MetadataResponse),
          ),
        ),
    }).pipe(
      map(({ home, metadata }) => this.buildHomeData(home, metadata)),
      tap((data) => {
        this.homeCache = { data, timestamp: Date.now() };
      }),
    );
  }

  private buildHomeData(
    home: HomePageResponse | null,
    metadata: MetadataResponse,
  ): PublicHomeDataDto {
    if (!home) {
      return {
        stats: {
          totalDoctors: 0,
          totalPatients: 0,
          totalAppointments: 0,
          averageRating: 0,
        },
        featuredProfessionals: [],
        specialties: [],
        metadata,
      };
    }

    return {
      stats: this.mapStats(home),
      featuredProfessionals: this.mapProfessionals(home.featuredProfessionals),
      specialties: this.mapSpecialties(home.featuredSpecialties),
      seo: home.seo,
      popularCities: home.popularCities,
      metadata,
    };
  }

  private mapStats(home: HomePageResponse): PublicHomeStatsDto {
    const current: PublicHomeStatsDto = {
      totalDoctors: home.totals.totalProfessionals ?? 0,
      totalPatients: home.totals.totalPatients ?? 0,
      totalAppointments: home.totals.totalAppointments ?? 0,
      averageRating: 0,
    };
    return this.applyStatsFloor(current);
  }

  /** Ensures stats never decrease by persisting the historical maximum. */
  private applyStatsFloor(stats: PublicHomeStatsDto): PublicHomeStatsDto {
    if (!isPlatformBrowser(this.platformId)) return stats;

    let stored: Partial<PublicHomeStatsDto> = {};
    try {
      const raw = localStorage.getItem(STATS_MAX_KEY);
      if (raw) stored = JSON.parse(raw) as Partial<PublicHomeStatsDto>;
    } catch { /* ignore */ }

    const result: PublicHomeStatsDto = {
      totalDoctors: Math.max(stats.totalDoctors, stored.totalDoctors ?? 0),
      totalPatients: Math.max(stats.totalPatients, stored.totalPatients ?? 0),
      totalAppointments: Math.max(stats.totalAppointments, stored.totalAppointments ?? 0),
      averageRating: stats.averageRating,
    };

    try {
      localStorage.setItem(STATS_MAX_KEY, JSON.stringify(result));
    } catch { /* ignore */ }

    return result;
  }

  private mapSpecialties(specialties: PublicHomeSpecialtyDto[]): Array<{
    id: string;
    name: string;
    icon?: string;
    professionalCount?: number;
  }> {
    return specialties.map((specialty) => ({
      id: specialty.id,
      name: specialty.name,
      icon: specialty.icon,
      professionalCount: specialty.professionalCount,
    }));
  }

  private mapProfessionals(
    professionals: HomePageResponse['featuredProfessionals'],
  ): PublicHomeProfessionalCardDto[] {
    return professionals.map((professional) => {
      const fullName = professional.businessName;
      const [firstName = fullName, ...restNames] = fullName.split(' ');
      const primarySpecialty =
        professional.specialties.find((specialty) => specialty.isPrimary)
          ?.specialtyName ??
        professional.specialties[0]?.specialtyName ??
        'Especialista';

      return {
        id: professional.id,
        slug: professional.slug,
        firstName,
        lastName: restNames.join(' '),
        fullName,
        specialty: primarySpecialty,
        avatarUrl: professional.profileImageUrl,
        rating: 0,
        reviewsCount: 0,
        yearsOfExperience: 0,
        isAvailable: true,
        cityName: professional.cityName,
        citySlug: professional.citySlug,
        isVerified: professional.isVerified,
        isFeatured: professional.isFeatured,
        priceFrom: professional.priceFrom,
      };
    });
  }

  clearCache(): void {
    this.homeCache = null;
  }
}
