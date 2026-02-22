import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthStore } from '@core/auth';
import { SeoService } from '@shared/services';
import {
  PublicHomeProfessionalCardDto,
  PublicHomeStatsDto,
} from '../../../../public/models/public-home.dto';
import { PublicHomeService } from '../../../../public/services/public-home.service';
import {
  AuthModalComponent,
  AuthModalData,
} from '../../components/auth-modal/auth-modal.component';
import { ProfessionalCardComponent } from '../../components/professional-card.component';
import { PublicFooterComponent } from '../../components/public-footer.component';
import { PublicHeaderComponent } from '../../components/public-header.component';
import { AuthIntentService } from '../../services/auth-intent.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    PublicHeaderComponent,
    PublicFooterComponent,
    ProfessionalCardComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePageComponent implements OnInit {
  private readonly homeService = inject(PublicHomeService);
  private readonly seoService = inject(SeoService);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);
  private readonly authIntent = inject(AuthIntentService);

  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly isPatientAuthenticated = computed(() =>
    this.authStore
      .availableContexts()
      .some((context) => context.type === 'PATIENT'),
  );

  stats = signal<PublicHomeStatsDto | null>(null);
  professionals = signal<PublicHomeProfessionalCardDto[]>([]);
  specialties = signal<
    Array<{
      id: string;
      name: string;
      icon?: string;
      professionalCount?: number;
    }>
  >([]);
  loadingStats = signal(true);
  loadingProfessionals = signal(true);
  loadingSpecialties = signal(true);

  ngOnInit(): void {
    this.seoService.setSeo({
      title: 'MediTigo - Tu Directorio Médico de Confianza',
      description:
        'Encuentra y agenda citas con los mejores profesionales de la salud. Atención médica de calidad a tu alcance.',
    });

    this.loadHomeData();
  }

  private loadHomeData(): void {
    this.loadingStats.set(true);
    this.loadingProfessionals.set(true);
    this.loadingSpecialties.set(true);

    this.homeService.getHomeData(8, 6).subscribe((data) => {
      this.stats.set(data.stats);
      this.professionals.set(data.featuredProfessionals);
      this.specialties.set(data.specialties);

      if (data.seo) {
        this.seoService.setSeo(data.seo);
      }

      this.loadingStats.set(false);
      this.loadingProfessionals.set(false);
      this.loadingSpecialties.set(false);
    });
  }

  onSpecialtyClick(specialty: {
    id: string;
    name: string;
    icon?: string;
  }): void {
    this.router.navigate(['/search'], {
      queryParams: { q: specialty.name },
    });
  }

  navigateToSearch(): void {
    this.router.navigate(['/search']);
  }

  openAuthModal(asProfessional = false): void {
    this.authIntent.setAsProfessional(asProfessional);
    this.dialog.open<AuthModalComponent, AuthModalData>(AuthModalComponent, {
      data: { asProfessional },
      width: '440px',
      maxWidth: '100vw',
      panelClass: 'auth-modal-panel',
      autoFocus: 'first-tabbable',
    });
  }

  navigateToLogin(): void {
    this.openAuthModal(false);
  }

  navigateToProfile(): void {
    this.router.navigate(['/patient/profile']);
  }

  navigateToNewAppointment(): void {
    this.router.navigate(['/patient/wizard']);
  }

  get isInitialLoading(): boolean {
    return (
      this.loadingStats() &&
      this.loadingProfessionals() &&
      this.loadingSpecialties()
    );
  }

  reload(): void {
    this.homeService.clearCache();
    this.loadHomeData();
  }
}
