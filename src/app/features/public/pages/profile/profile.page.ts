import { Component, computed, effect, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { AuthService, AuthStore } from '@core/auth';
import { PublicProfessionalDetailResponse } from '@data/api';
import { ProfileStore } from '@data/stores';
import { AnalyticsService, SeoService } from '@shared/services';
import { isNotFoundError } from '@shared/utils';
import { BookAppointmentDialogComponent } from '../../components/book-appointment-dialog.component';
import { PublicFooterComponent } from '../../components/public-footer.component';
import { PublicHeaderComponent } from '../../components/public-header.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    PublicHeaderComponent,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    PublicFooterComponent,
  ],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePageComponent {
  readonly store = inject(ProfileStore);
  private readonly seoService = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly estimatedTariff = computed(() => {
    const value = this.store.profile()?.consultationValue;
    return typeof value === 'number' && value > 0 ? value : null;
  });

  readonly profileSpecialties = computed(() => {
    const profile = this.store.profile();
    const specialtyNames = profile?.specialtyNames ?? [];
    const specialties = (profile?.specialties ?? [])
      .map((item) => item.name?.trim())
      .filter((name): name is string => !!name);

    const unique = [...new Set([...specialtyNames, ...specialties])];
    return unique.slice(0, 6);
  });

  readonly hasLocations = computed(() => this.store.locations().length > 0);

  // Route param via input binding
  slug = input.required<string>();

  private readonly slugEffect = effect(() => {
    const currentSlug = this.slug();
    if (currentSlug) {
      this.loadProfile(currentSlug);
    }
  });

  private loadProfile(slug: string): void {
    this.store.load(slug).subscribe({
      next: (pro) => {
        this.setProfileSeo(pro);
        this.analytics.trackViewProfile({
          professionalId: pro.id,
          slug: pro.slug,
          city: pro.cityName ?? '',
          category: this.profileSpecialties()[0] ?? '',
        });
      },
      error: (err) => {
        // Redirect to not-found on 404
        if (isNotFoundError(err)) {
          this.router.navigate(['/not-found'], { replaceUrl: true });
        }
        // Other errors are handled by the store and shown in UI
      },
    });
  }

  reload(): void {
    const currentSlug = this.slug();
    if (currentSlug) {
      this.store.load(currentSlug, true).subscribe({
        next: (pro) => this.setProfileSeo(pro),
      });
    }
  }

  goToSearch(): void {
    this.router.navigate(['/search']);
  }

  bookAppointment(): void {
    const profile = this.store.profile();
    if (!profile) return;

    const isAuthenticated =
      this.authStore.isAuthenticated() || this.authService.isAuthenticated();
    const hasPatientContext =
      this.authStore.currentContext()?.type === 'PATIENT' ||
      this.authStore.availableContexts().some((ctx) => ctx.type === 'PATIENT');

    if (isAuthenticated && (hasPatientContext || this.authService.isClient())) {
      this.dialog.open(BookAppointmentDialogComponent, {
        width: '760px',
        maxWidth: '96vw',
        data: {
          slug: profile.slug,
          professionalId: profile.id,
          name: profile.displayName,
          imageUrl: profile.profileImageUrl,
          specialties: this.profileSpecialties(),
        },
      });
      return;
    }

    this.router.navigate(['/login'], {
      queryParams: {
        returnUrl: `/pro/${profile.id}`,
      },
    });
  }

  private setProfileSeo(profile: PublicProfessionalDetailResponse): void {
    this.seoService.setTitle(`${profile.displayName} | MediTigo`);
    this.seoService.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: profile.displayName,
      description: profile.bio,
      image: profile.profileImageUrl,
      address: {
        '@type': 'PostalAddress',
        streetAddress: profile.address,
        addressLocality: profile.cityName,
        addressCountry: profile.countryName,
      },
    });
  }
}
