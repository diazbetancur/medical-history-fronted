import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '@core/auth';

/**
 * Persistent warning banner shown across the professional panel when the
 * professional's plan/license has lapsed. The backend is the source of truth
 * (writes return 403 LICENSE_INACTIVE); this banner explains the read-only state.
 */
@Component({
  selector: 'app-license-banner',
  standalone: true,
  imports: [MatIconModule],
  template: `
    @if (authStore.licenseLapsed()) {
      <div class="license-banner" role="alert">
        <mat-icon aria-hidden="true">warning</mat-icon>
        <span>
          Tu plan está inactivo. Contacta a tu canal o a soporte para reactivarlo.
          Mientras tanto no puedes gestionar tu agenda ni tu información.
        </span>
      </div>
    }
  `,
  styles: [
    `
      .license-banner {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.75rem 1rem;
        background: #fff3e0;
        color: #8a5300;
        border-bottom: 1px solid #ffcc80;
        font-size: 0.9rem;
        line-height: 1.4;
      }
      .license-banner mat-icon {
        flex: none;
      }
    `,
  ],
})
export class LicenseBannerComponent {
  readonly authStore = inject(AuthStore);
}
