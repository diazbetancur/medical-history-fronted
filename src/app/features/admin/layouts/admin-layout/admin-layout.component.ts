import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
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
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly platform = inject(PlatformService);

  isMobile = signal(false);

  navItems: NavItem[] = [
    { icon: 'dashboard', label: 'Panel Principal', route: '/admin' },
    {
      icon: 'people',
      label: 'Revisar Profesionales',
      route: '/admin/professionals',
    },
    {
      icon: 'mail',
      label: 'Solicitudes',
      route: '/admin/requests',
    },
    { icon: 'analytics', label: 'Estadísticas', route: '/admin/stats' },
    { icon: 'settings', label: 'Configuración', route: '/admin/settings' },
  ];

  constructor() {
    // Only observe breakpoints in browser
    if (this.platform.isBrowser) {
      this.breakpointObserver
        .observe([Breakpoints.Handset])
        .subscribe((result) => {
          this.isMobile.set(result.matches);
        });
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
