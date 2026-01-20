import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PwaUpdateService } from '@core/pwa';

/**
 * PWA Update Banner Component
 * Shows when a new service worker version is available.
 */
@Component({
  selector: 'app-update-banner',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (pwaUpdate.updateAvailable()) {
    <div
      class="update-banner"
      role="alert"
      aria-label="Nueva versión disponible"
    >
      <div class="update-content">
        <mat-icon class="update-icon">system_update</mat-icon>
        <span class="update-text">Nueva versión disponible</span>
        <button
          mat-flat-button
          color="accent"
          (click)="update()"
          class="update-btn"
        >
          Actualizar
        </button>
        <button
          mat-icon-button
          (click)="dismiss()"
          aria-label="Cerrar"
          class="close-btn"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
    }
  `,
  styles: [
    `
      .update-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #323232;
        color: white;
        padding: 12px 16px;
        z-index: 1001;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        animation: slideDown 0.3s ease-out;
      }

      @keyframes slideDown {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .update-content {
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 600px;
        margin: 0 auto;
      }

      .update-icon {
        flex-shrink: 0;
        color: #69f0ae;
      }

      .update-text {
        flex: 1;
        font-size: 0.95rem;
      }

      .update-btn {
        flex-shrink: 0;
      }

      .close-btn {
        flex-shrink: 0;
        color: white;
        opacity: 0.7;

        &:hover {
          opacity: 1;
        }
      }

      @media (max-width: 480px) {
        .update-banner {
          padding: 10px 12px;
        }

        .update-content {
          gap: 8px;
        }

        .update-text {
          font-size: 0.85rem;
        }
      }
    `,
  ],
})
export class UpdateBannerComponent {
  readonly pwaUpdate = inject(PwaUpdateService);

  update(): void {
    this.pwaUpdate.activateUpdate();
  }

  dismiss(): void {
    this.pwaUpdate.dismissUpdate();
  }
}
