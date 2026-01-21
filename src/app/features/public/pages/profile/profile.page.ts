import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  effect,
  inject,
  input,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink } from '@angular/router';
import { ProfileStore } from '@data/stores';
import { AnalyticsService, SeoService } from '@shared/services';
import { ContactDialogComponent, ContactDialogData } from '@shared/ui';
import { isNotFoundError } from '@shared/utils';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePageComponent implements OnInit {
  readonly store = inject(ProfileStore);
  private readonly seoService = inject(SeoService);
  private readonly analytics = inject(AnalyticsService);
  private readonly dialog = inject(MatDialog);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  // Route param via input binding
  slug = input.required<string>();

  private slugEffect = effect(() => {
    const currentSlug = this.slug();
    if (currentSlug) {
      this.loadProfile(currentSlug);
    }
  });

  ngOnInit(): void {
    // Profile loads via effect when slug changes
  }

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

  /**
   * Track contact click event and open modal for form
   */
  onContactClick(channel: 'whatsapp' | 'phone' | 'form'): void {
    const profile = this.store.profile();
    if (!profile) return;

    // Track click event
    this.analytics.trackClickContact({
      professionalId: profile.id,
      channel,
      professionalName: profile.businessName,
    });

    // Open contact dialog for form channel (only in browser)
    if (channel === 'form' && isPlatformBrowser(this.platformId)) {
      this.openContactDialog();
    }
  }

  /**
   * Open contact dialog modal
   */
  private openContactDialog(): void {
    const profile = this.store.profile();
    if (!profile) return;

    const services = this.store.services();

    const dialogData: ContactDialogData = {
      professionalId: profile.id,
      professionalName: profile.businessName,
      professionalSlug: profile.slug,
      services: services.length > 0 ? services : undefined,
    };

    this.dialog.open(ContactDialogComponent, {
      data: dialogData,
      width: '480px',
      maxWidth: '95vw',
      disableClose: false,
    });
  }
}
