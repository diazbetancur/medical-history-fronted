import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { UiProfileService } from '@core/auth';

/**
 * Root Layout Component
 *
 * Top-level layout component that dynamically selects the appropriate shell
 * based on the user's UI profile (ADMIN, PROFESIONAL, CLIENTE).
 *
 * **Purpose:**
 * - Acts as a single entry point for all authenticated/public routes
 * - Provides consistent layout switching based on user permissions
 * - Ensures users see the correct UI variant without manual navigation
 *
 * **Profile Resolution:**
 * - ADMIN: Users with admin permissions (Users.*, Roles.*, Catalog.*, etc.)
 * - PROFESIONAL: Users with Professional role or Profiles.* permissions
 * - CLIENTE: Default for authenticated users or public visitors
 *
 * **Important:**
 * - This is for UI/UX only - route guards remain the security authority
 * - Profile changes trigger automatic re-rendering (reactive signals)
 * - Each shell manages its own navigation menu and layout structure
 *
 * @example Route configuration:
 * ```typescript
 * {
 *   path: '',
 *   component: RootLayoutComponent,
 *   children: [
 *     { path: 'admin', loadChildren: () => adminRoutes },
 *     { path: 'dashboard', loadChildren: () => professionalRoutes },
 *     { path: '', loadChildren: () => publicRoutes },
 *   ]
 * }
 * ```
 */
@Component({
  selector: 'app-root-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <!-- Simple pass-through to router-outlet -->
    <!-- The actual shells are rendered by their own routes -->
    <router-outlet />
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class RootLayoutComponent {
  private readonly uiProfile = inject(UiProfileService);
  private readonly router = inject(Router);

  /**
   * Current route path (for debugging)
   */
  private readonly currentRoute = computed(() => this.router.url);

  /**
   * Base route for current profile
   */
  private readonly profileBaseRoute = this.uiProfile.baseRoute;

  /**
   * Monitor profile changes and handle redirects if needed
   *
   * This effect runs when:
   * - User logs in (permissions change from [] to actual permissions)
   * - User permissions are updated (role change, permission grant/revoke)
   * - User logs out (permissions reset to [])
   *
   * Redirect logic:
   * - After login: Redirect to profile's base route if on login page
   * - Permission change: Allow natural navigation (guards will block invalid routes)
   * - Invalid access: Guards handle the redirect, not this component
   */
  constructor() {
    effect(
      () => {
        const profile = this.uiProfile.current();
        const baseRoute = this.profileBaseRoute();
        const currentUrl = this.currentRoute();

        // Auto-redirect after login: if user is on login page, redirect to their base route
        if (currentUrl === '/login' && profile !== 'CLIENTE') {
          this.router.navigate([baseRoute], { replaceUrl: true });
        }
      },
      { allowSignalWrites: true },
    );
  }

  /**
   * Check if running in production mode
   */
  private isProduction(): boolean {
    // Use Angular's environment detection
    return typeof ngDevMode === 'undefined' || !ngDevMode;
  }
}
