import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Component, inject, signal } from '@angular/core';
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
import { AuthService, UiProfileService } from '@core/auth';
import { PlatformService } from '@core/platform';
import { MenuBuilderService } from '@core/services/menu-builder.service';

/**
 * Professional Shell Component
 *
 * Main layout for professional area (dashboard).
 * Shows sidenav with professional menu items based on user permissions.
 *
 * **Security:**
 * - Route guards (authGuard, uiProfileProfessionalGuard) enforce access
 * - This component is pure presentation
 *
 * **Features:**
 * - Dynamic menu from MenuBuilderService (permission-based filtering)
 * - Responsive: Sidenav drawer on mobile, persistent on desktop
 * - Material Design sidenav layout
 *
 * @example Usage in routes:
 * ```typescript
 * {
 *   path: 'dashboard',
 *   component: ProfessionalShellComponent,
 *   canActivate: [authGuard, uiProfileProfessionalGuard],
 *   children: [
 *     { path: '', component: DashboardHomeComponent },
 *     { path: 'profile', component: ProfileComponent },
 *     // ...
 *   ]
 * }
 * ```
 */
@Component({
  selector: 'app-professional-shell',
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
  templateUrl: './professional-shell.component.html',
  styleUrl: './professional-shell.component.scss',
})
export class ProfessionalShellComponent {
  readonly authService = inject(AuthService);
  readonly menuBuilder = inject(MenuBuilderService);
  readonly uiProfile = inject(UiProfileService);
  private readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly platform = inject(PlatformService);

  isMobile = signal(false);

  // Dynamic menu from MenuBuilderService
  readonly professionalMenu = this.menuBuilder.professionalMenu;
  readonly footerMenu = this.menuBuilder.professionalFooterMenu;

  /**
   * Should render professional layout (user has PROFESIONAL profile)
   * Guards ensure this is always true when component loads.
   */
  readonly shouldRenderLayout = this.uiProfile.isProfessional;

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
