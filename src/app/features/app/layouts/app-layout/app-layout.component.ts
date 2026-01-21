import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from '@core/auth';
import { PlatformService } from '@core/platform';

interface NavItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platform = inject(PlatformService);

  navItems: NavItem[] = [
    { icon: 'home', label: 'Inicio', route: '/dashboard' },
    { icon: 'inbox', label: 'Solicitudes', route: '/dashboard/requests' },
    { icon: 'person', label: 'Perfil', route: '/dashboard/profile' },
    { icon: 'settings', label: 'Ajustes', route: '/dashboard/settings' },
  ];

  currentPageTitle = signal('Dashboard');

  /**
   * Check if user has admin access based on permissions (not roles)
   * User must have at least one admin-level permission to see Admin Panel link
   */
  readonly hasAdminAccess = computed(() => this.authService.isAdminArea());

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
