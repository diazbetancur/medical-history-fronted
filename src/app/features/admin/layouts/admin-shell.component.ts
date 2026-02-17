import { Component, inject } from '@angular/core';
import { UiProfileService } from '@core/auth';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';

/**
 * Admin Shell Component
 *
 * Wrapper for AdminLayoutComponent that ensures only users with ADMIN profile
 * can access the admin area UI.
 *
 * **Security Layers:**
 * 1. Route guards (authGuard, uiProfileAdminGuard, adminAreaGuard) - Primary security (ENFORCED)
 * 2. This shell - Pure presentation (renders admin layout or fallback message)
 * 3. Backend - Final authority (403 responses)
 *
 * **Behavior:**
 * - If user has ADMIN profile → Render AdminLayoutComponent
 * - If user doesn't have ADMIN profile → Show redirect message (guards prevent this)
 *
 * **Important:**
 * - Guards handle navigation control (no redirect logic in component)
 * - This component only decides what to render based on profile
 * - Profile changes trigger automatic re-evaluation (reactive signals)
 *
 * @example In admin.routes.ts:
 * ```typescript
 * {
 *   path: '',
 *   component: AdminShellComponent,
 *   canActivate: [authGuard, uiProfileAdminGuard, adminAreaGuard],
 *   children: [ ... ]
 * }
 * ```
 */
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [AdminLayoutComponent],
  template: `
    @if (shouldRenderLayout()) {
      <app-admin-layout />
    } @else {
      <!-- Fallback: Should not reach here if guards work correctly -->
      <div class="redirect-message">
        <p>Acceso no autorizado. Redirigiendo...</p>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      .redirect-message {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-size: 1.2rem;
        color: var(--color-text-secondary);
      }
    `,
  ],
})
export class AdminShellComponent {
  private readonly uiProfile = inject(UiProfileService);

  /**
   * Should render admin layout (user has ADMIN profile)
   * Guards ensure this is always true when component loads.
   */
  readonly shouldRenderLayout = this.uiProfile.isAdmin;
}
