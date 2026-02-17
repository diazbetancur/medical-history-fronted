import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

/**
 * Offline Page Component
 * Displayed when the app is offline and the requested page is not cached.
 */
@Component({
  selector: 'app-offline-page',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="offline-container">
      <div class="offline-content">
        <mat-icon class="offline-icon">cloud_off</mat-icon>
        <h1>Sin conexión</h1>
        <p>
          No tienes conexión a internet. Algunas funciones pueden no estar
          disponibles.
        </p>
        <div class="offline-actions">
          <button mat-raised-button color="primary" (click)="retry()">
            <mat-icon>refresh</mat-icon>
            Reintentar
          </button>
          <a mat-button routerLink="/">
            <mat-icon>home</mat-icon>
            Ir al inicio
          </a>
        </div>
        <div class="offline-tips">
          <h3>Mientras tanto puedes:</h3>
          <ul>
            <li>Revisar páginas que hayas visitado antes (están en caché)</li>
            <li>Verificar tu conexión WiFi o datos móviles</li>
            <li>Intentar de nuevo en unos momentos</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .offline-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: var(--color-background-alt);
      }

      .offline-content {
        text-align: center;
        max-width: 400px;
        background: white;
        padding: 48px 32px;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      }

      .offline-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: var(--color-text-disabled);
        margin-bottom: 16px;
      }

      h1 {
        margin: 0 0 16px;
        font-size: 1.75rem;
        color: var(--color-text-primary);
      }

      p {
        margin: 0 0 24px;
        color: var(--color-text-secondary);
        line-height: 1.5;
      }

      .offline-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 32px;

        button,
        a {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
      }

      .offline-tips {
        text-align: left;
        background: var(--color-background-alt);
        padding: 16px;
        border-radius: 8px;

        h3 {
          margin: 0 0 12px;
          font-size: 0.9rem;
          color: var(--color-text-secondary);
        }

        ul {
          margin: 0;
          padding-left: 20px;

          li {
            margin-bottom: 8px;
            font-size: 0.85rem;
            color: var(--color-text-secondary);

            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }

      @media (max-width: 480px) {
        .offline-content {
          padding: 32px 20px;
        }

        .offline-icon {
          font-size: 60px;
          width: 60px;
          height: 60px;
        }

        h1 {
          font-size: 1.5rem;
        }
      }
    `,
  ],
})
export class OfflinePageComponent {
  retry(): void {
    window.location.reload();
  }
}
