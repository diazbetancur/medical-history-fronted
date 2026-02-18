import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, effect, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService, MenuBuilderService } from '@core/index';
import { PlatformService } from '@core/platform';

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
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  readonly authService = inject(AuthService);
  readonly menuBuilder = inject(MenuBuilderService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly platform = inject(PlatformService);

  isMobile = signal(false);

  // Dynamic menu from MenuBuilderService
  readonly adminMenu = this.menuBuilder.adminMenu;
  readonly footerMenu = this.menuBuilder.footerMenu;

  constructor() {
    // Only observe breakpoints in browser
    if (this.platform.isBrowser) {
      this.breakpointObserver
        .observe([Breakpoints.Handset])
        .subscribe((result) => {
          this.isMobile.set(result.matches);
        });
    }

    // Check admin access - redirect if user has no admin permissions
    effect(() => {
      const hasAccess = this.menuBuilder.hasAdminAccess();
      const visibleItems = this.menuBuilder.visibleItemCount();

      // If user is authenticated but has no admin access or no visible menu items
      if (
        this.authService.isAuthenticated() &&
        (!hasAccess || visibleItems === 0)
      ) {
        // Redirect to dashboard
        this.router.navigate(['/dashboard'], { replaceUrl: true });
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
