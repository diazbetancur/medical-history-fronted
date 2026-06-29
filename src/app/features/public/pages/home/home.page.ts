import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore } from '@core/auth';
import { SeoService } from '@shared/services';
import { ToastService } from '@shared/services/toast.service';
import {
  PublicHomeProfessionalCardDto,
  PublicHomeStatsDto,
} from '../../../../public/models/public-home.dto';
import { PublicHomeService } from '../../../../public/services/public-home.service';
import {
  AuthModalComponent,
  AuthModalData,
} from '../../components/auth-modal/auth-modal.component';
import { PublicFooterComponent } from '../../components/public-footer/public-footer.component';
import { PublicHeaderComponent } from '../../components/public-header/public-header.component';
import { FeaturedDoctorsComponent } from './components/featured-doctors/featured-doctors.component';
import { HomeSliderComponent } from './components/home-slider/home-slider.component';
import AOS from 'aos';

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
    FeaturedDoctorsComponent,
    HomeSliderComponent,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export class HomePageComponent implements OnInit, AfterViewInit {
  private readonly homeService = inject(PublicHomeService);
  private readonly seoService = inject(SeoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);

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
    this.showAuthRedirectMessageIfNeeded();

    this.seoService.setSeo({
      title: 'MediTigo - Tu Directorio Médico de Confianza',
      description:
        'Encuentra y agenda citas con los mejores profesionales de la salud. Atención médica de calidad a tu alcance.',
    });

    this.loadHomeData();
  }

  ngAfterViewInit(): void {
    AOS.init({ once: true, duration: 600, easing: 'ease-out', offset: 80 });
  }

  private showAuthRedirectMessageIfNeeded(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    const authRequired = queryParams.get('authRequired');
    const reason = queryParams.get('reason');
    const passwordReset = queryParams.get('passwordReset');

    if (passwordReset === '1') {
      // Contraseña restablecida exitosamente: mostrar toast y abrir modal de login
      this.toast.info(
        '¡Contraseña actualizada! Inicia sesión con tu nueva contraseña.',
      );
      // Pequeño delay para que el home termine de renderizar antes de abrir el modal
      setTimeout(() => this.openAuthModal(), 350);
    } else if (reason === 'session_expired') {
      this.toast.info(
        'Tu sesión expiró. Inicia sesión nuevamente desde el botón "Iniciar Sesión".',
      );
    } else if (authRequired === '1') {
      this.toast.info(
        'Debes iniciar sesión para continuar. Usa el botón "Iniciar Sesión".',
      );
    } else {
      return;
    }

    // Limpiar todos los query params de estado de la URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        authRequired: null,
        reason: null,
        returnUrl: null,
        passwordReset: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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

  openAuthModal(initialTab = 0): void {
    this.dialog.open<AuthModalComponent, AuthModalData>(AuthModalComponent, {
      data: { initialTab },
      width: '440px',
      maxWidth: '100vw',
      panelClass: 'auth-modal-panel',
      autoFocus: 'first-tabbable',
    });
  }

  navigateToLogin(): void {
    this.openAuthModal();
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
