import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

/**
 * 403 - Not Authorized Page
 *
 * Página mostrada cuando un usuario intenta acceder a un recurso
 * sin los permisos necesarios.
 *
 * UX:
 * - Mensaje claro del error
 * - Explicación amigable
 * - Botones de navegación para salir
 */
@Component({
  selector: 'app-not-authorized',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="not-authorized-container">
      <div class="not-authorized-content">
        <!-- Icon -->
        <mat-icon class="error-icon">block</mat-icon>

        <!-- Error Code -->
        <h1 class="error-code">403</h1>

        <!-- Title -->
        <h2 class="error-title">Acceso No Autorizado</h2>

        <!-- Message -->
        <p class="error-message">
          No tienes los permisos necesarios para acceder a este recurso.
        </p>

        <!-- Hint -->
        <p class="error-hint">
          Si crees que deberías tener acceso, contacta al administrador del
          sistema para solicitar los permisos correspondientes.
        </p>

        <!-- Actions -->
        <div class="actions">
          <a mat-raised-button color="primary" routerLink="/dashboard">
            <mat-icon>arrow_back</mat-icon>
            Ir al Dashboard
          </a>

          <a mat-stroked-button routerLink="/">
            <mat-icon>home</mat-icon>
            Ir al Inicio
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .not-authorized-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 24px;
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      }

      .not-authorized-content {
        text-align: center;
        max-width: 500px;
        background: white;
        padding: 48px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      }

      .error-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
        color: #f44336;
        margin: 0 auto 24px;
        display: block;
      }

      .error-code {
        font-size: 72px;
        font-weight: 700;
        color: #f44336;
        margin: 0 0 16px;
        line-height: 1;
      }

      .error-title {
        font-size: 28px;
        font-weight: 500;
        color: #333;
        margin: 0 0 16px;
      }

      .error-message {
        font-size: 16px;
        color: #666;
        margin: 0 0 12px;
        line-height: 1.6;
      }

      .error-hint {
        font-size: 14px;
        color: #999;
        margin: 0 0 32px;
        line-height: 1.5;
      }

      .actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
      }

      .actions a {
        min-width: 160px;
      }

      /* Mobile adjustments */
      @media (max-width: 600px) {
        .not-authorized-content {
          padding: 32px 24px;
        }

        .error-icon {
          font-size: 60px;
          width: 60px;
          height: 60px;
        }

        .error-code {
          font-size: 56px;
        }

        .error-title {
          font-size: 24px;
        }

        .actions {
          flex-direction: column;
        }

        .actions a {
          width: 100%;
        }
      }
    `,
  ],
})
export class NotAuthorizedPageComponent {}
