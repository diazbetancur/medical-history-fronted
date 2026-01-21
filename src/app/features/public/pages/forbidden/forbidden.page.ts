import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden-page',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="forbidden-container">
      <div class="forbidden-content">
        <mat-icon class="forbidden-icon">block</mat-icon>
        <h1>Acceso Denegado</h1>
        <p class="message">
          No tienes los permisos necesarios para acceder a esta página.
        </p>
        <p class="hint">
          Si crees que deberías tener acceso, contacta al administrador del
          sistema.
        </p>
        <div class="actions">
          <a mat-raised-button color="primary" routerLink="/dashboard">
            <mat-icon>arrow_back</mat-icon>
            Volver al Dashboard
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
      .forbidden-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 24px;
        background: var(--color-background);
      }

      .forbidden-content {
        text-align: center;
        max-width: 500px;
      }

      .forbidden-icon {
        font-size: 120px;
        width: 120px;
        height: 120px;
        color: var(--color-error);
        margin-bottom: 24px;
      }

      h1 {
        font-size: 2rem;
        font-weight: 500;
        margin-bottom: 16px;
        color: var(--color-text-primary);
      }

      .message {
        font-size: 1.1rem;
        color: var(--color-text-secondary);
        margin-bottom: 12px;
      }

      .hint {
        font-size: 0.95rem;
        color: var(--color-text-secondary);
        margin-bottom: 32px;
      }

      .actions {
        display: flex;
        gap: 16px;
        justify-content: center;
        flex-wrap: wrap;

        button,
        a {
          min-width: 180px;
        }
      }
    `,
  ],
})
export class ForbiddenPageComponent {}
