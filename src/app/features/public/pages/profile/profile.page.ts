import { Component, computed, effect, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink } from '@angular/router';
import { AuthService, AuthStore } from '@core/auth';
import { ProfileStore } from '@data/stores';
import { AnalyticsService, SeoService } from '@shared/services';
import { isNotFoundError } from '@shared/utils';
import { BookAppointmentDialogComponent } from '../../components/book-appointment-dialog.component';
import { PublicHeaderComponent } from '../../components/public-header.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    PublicHeaderComponent,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
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
    const prices = this.store
      .services()
      .map((service) => service.priceFrom)
      .filter((price): price is number => !!price);

    if (prices.length === 0) {
      return null;
    }

    return Math.min(...prices);
  });

  readonly profileSpecialties = computed(() => {
    const profile = this.store.profile();
    const category = profile?.categoryName?.trim();
    const serviceNames = this.store
      .services()
      .map((service) => service.name?.trim())
      .filter((name): name is string => !!name);

    const unique = [
      ...new Set([...(category ? [category] : []), ...serviceNames]),
    ];
    return unique.slice(0, 6);
  });

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
      next: (response) => {
        if (response.seo) {
          this.seoService.setSeo(response.seo);
        }

        // Track profile view (only when data is loaded)
        if (response.profile) {
          const pro = response.profile;

          this.analytics.trackViewProfile({
            professionalId: pro.id,
            slug: pro.slug,
            city: pro.cityName,
            category: pro.categoryName,
          });

          // Set JSON-LD structured data for professionals
          this.seoService.setJsonLd({
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: pro.businessName,
            description: pro.description,
            image: pro.profileImageUrl,
            address: {
              '@type': 'PostalAddress',
              addressLocality: pro.cityName,
              addressCountry: pro.countryName,
            },
          });
        }
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
        next: (response) => {
          if (response.seo) {
            this.seoService.setSeo(response.seo);
          }
        },
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
          name: profile.businessName,
          imageUrl: profile.profileImageUrl,
          specialties: this.profileSpecialties(),
        },
      });
      return;
    }

    this.router.navigate(['/login'], {
      queryParams: {
        returnUrl: `/pro/${profile.slug}`,
      },
    });
  }
}
