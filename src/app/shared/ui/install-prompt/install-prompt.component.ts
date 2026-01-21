import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PwaInstallService } from '@core/pwa';

/**
 * PWA Install Prompt Component
 * Shows install button for Chrome/Android or iOS guide for Safari.
 * Only renders when shouldShowInstallUI is true.
 */
@Component({
  selector: 'app-install-prompt',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (pwaInstall.shouldShowInstallUI()) {
    <div class="install-prompt" role="banner" aria-label="Instalar aplicación">
      @if (pwaInstall.isIOS()) {
      <!-- iOS Safari Guide -->
      <div class="install-content">
        <mat-icon class="install-icon">ios_share</mat-icon>
        <div class="install-text">
          <strong>Instalar ProDirectory</strong>
          <span
            >Toca
            <mat-icon class="inline-icon">ios_share</mat-icon>
            y luego "Agregar a inicio"</span
          >
        </div>
        <button
          mat-icon-button
          (click)="dismiss()"
          aria-label="Cerrar"
          class="close-btn"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>
      } @else if (pwaInstall.canInstall()) {
      <!-- Chrome/Android Install Button -->
      <div class="install-content">
        <mat-icon class="install-icon">download</mat-icon>
        <div class="install-text">
          <strong>Instalar ProDirectory</strong>
          <span>Acceso rápido desde tu pantalla de inicio</span>
        </div>
        <button
          mat-flat-button
          color="primary"
          (click)="install()"
          class="install-btn"
        >
          Instalar
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
      }
    </div>
    }
  `,
  styles: [
    `
      .install-prompt {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 16px;
        z-index: 1000;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
        animation: slideUp 0.3s ease-out;
      }

      @keyframes slideUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .install-content {
        display: flex;
        align-items: center;
        gap: 12px;
        max-width: 600px;
        margin: 0 auto;
      }

      .install-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        flex-shrink: 0;
      }

      .install-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;

        strong {
          font-size: 1rem;
        }

        span {
          font-size: 0.8rem;
          opacity: 0.9;
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }

      .inline-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        vertical-align: middle;
      }

      .install-btn {
        flex-shrink: 0;
      }

      .close-btn {
        flex-shrink: 0;
        color: white;
        opacity: 0.8;

        &:hover {
          opacity: 1;
        }
      }

      @media (max-width: 480px) {
        .install-prompt {
          padding: 10px 12px;
        }

        .install-content {
          gap: 8px;
        }

        .install-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }

        .install-text {
          strong {
            font-size: 0.9rem;
          }
          span {
            font-size: 0.75rem;
          }
        }
      }
    `,
  ],
})
export class InstallPromptComponent {
  readonly pwaInstall = inject(PwaInstallService);

  async install(): Promise<void> {
    await this.pwaInstall.promptInstall();
  }

  dismiss(): void {
    this.pwaInstall.dismissInstallUI();
  }
}
