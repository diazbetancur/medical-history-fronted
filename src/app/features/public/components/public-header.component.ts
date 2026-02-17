import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { AuthService, AuthStore } from '@core/auth';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterLink,
  ],
  template: `
    <mat-toolbar class="public-header">
      <div class="header-container">
        <a routerLink="/" class="logo">
          <span class="logo-text">MediTigo</span>
        </a>

        <nav class="nav-links desktop-only">
          <a routerLink="/" class="nav-link">Inicio</a>
          <a routerLink="/search" class="nav-link">Buscar Médicos</a>
          @if (isPatientAuthenticated()) {
            <a routerLink="/patient/profile" class="nav-link">Mi Perfil</a>
            <a routerLink="/patient/wizard" class="nav-link">Nueva Cita</a>
          }
        </nav>

        <div class="header-actions">
          @if (!isAuthenticated()) {
            <button mat-stroked-button class="desktop-only" (click)="navigateToProfessional()">
              Soy Médico
            </button>
            <button mat-flat-button color="primary" (click)="navigateToLogin()">
              Iniciar Sesión
            </button>
          } @else {
            <button mat-stroked-button class="desktop-only" (click)="logout()">
              Cerrar Sesión
            </button>
          }
          <button mat-icon-button class="mobile-only" [matMenuTriggerFor]="mobileMenu">
            <mat-icon>menu</mat-icon>
          </button>
        </div>
      </div>
    </mat-toolbar>

    <mat-menu #mobileMenu="matMenu">
      <button mat-menu-item routerLink="/">
        <mat-icon>home</mat-icon>
        Inicio
      </button>
      <button mat-menu-item routerLink="/search">
        <mat-icon>search</mat-icon>
        Buscar Médicos
      </button>
      @if (isPatientAuthenticated()) {
        <button mat-menu-item routerLink="/patient/profile">
          <mat-icon>person</mat-icon>
          Mi Perfil
        </button>
        <button mat-menu-item routerLink="/patient/wizard">
          <mat-icon>event</mat-icon>
          Nueva Cita
        </button>
      }
      @if (!isAuthenticated()) {
        <button mat-menu-item (click)="navigateToProfessional()">
          <mat-icon>work</mat-icon>
          Soy Médico
        </button>
        <button mat-menu-item (click)="navigateToLogin()">
          <mat-icon>login</mat-icon>
          Iniciar Sesión
        </button>
      } @else {
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          Cerrar Sesión
        </button>
      }
    </mat-menu>
  `,
  styles: [`
    .public-header {
      background: var(--color-surface);
      box-shadow: var(--shadow-1);
      position: sticky;
      top: 0;
      z-index: 1000;
      padding: 0;
    }

    .header-container {
      width: 100%;
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 58px;
    }

    .logo {
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 600;
      background: var(--gradient-primary);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .nav-links {
      display: flex;
      gap: 24px;
      flex: 1;
      justify-content: center;
    }

    .nav-link {
      color: var(--color-text-primary);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      padding: 8px 0;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;

      &:hover {
        color: var(--color-primary);
        border-bottom-color: var(--color-primary);
      }
    }

    .header-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .desktop-only {
      display: flex;
    }

    .mobile-only {
      display: none;
    }

    @media (max-width: 768px) {
      .desktop-only {
        display: none;
      }

      .mobile-only {
        display: flex;
      }

      .header-container {
        padding: 0 16px;
      }
    }
  `],
})
export class PublicHeaderComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authStore = inject(AuthStore);

  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly isPatientAuthenticated = computed(() =>
    this.authStore
      .availableContexts()
      .some((context) => context.type === 'PATIENT'),
  );

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToProfessional(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/professional']);
    } else {
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/professional' } });
    }
  }

  logout(): void {
    this.authStore.logout();
  }
}
