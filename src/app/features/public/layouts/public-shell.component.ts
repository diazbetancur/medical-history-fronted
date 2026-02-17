import { Component, inject } from '@angular/core';
import { UiProfileService } from '@core/auth';
import { PublicLayoutComponent } from './public-layout/public-layout.component';

/**
 * Public Shell Component
 *
 * Wrapper for PublicLayoutComponent that handles public/unauthenticated users.
 *
 * **Purpose:**
 * - Provides consistent entry point for public routes
 * - Shows PublicLayoutComponent for CLIENTE profile users
 * - No redirect logic (public area is always accessible)
 *
 * **Profile:**
 * - CLIENTE: Public users or authenticated users without special permissions
 *
 * @example Usage in routes:
 * ```typescript
 * {
 *   path: '',
 *   component: PublicShellComponent,
 *   children: [
 *     { path: '', component: HomeComponent },
 *     { path: 'directory', component: DirectoryComponent },
 *     // ...
 *   ]
 * }
 * ```
 */
@Component({
  selector: 'app-public-shell',
  standalone: true,
  imports: [PublicLayoutComponent],
  template: `
    <!-- Always render public layout (no profile check needed) -->
    <app-public-layout />
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
export class PublicShellComponent {
  readonly uiProfile = inject(UiProfileService);

  // Public area is always accessible - no redirect logic needed
  // Users can view public pages regardless of their profile
}
