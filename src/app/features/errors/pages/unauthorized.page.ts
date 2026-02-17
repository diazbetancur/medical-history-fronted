import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

/**
 * Página de error: Acceso no autorizado (401/Unauthorized)
 *
 * Mostrada cuando:
 * - contextGuard falla (usuario no tiene el contexto requerido)
 * - Usuario intenta acceder a ruta sin el contexto CLIENTE/PROFESIONAL
 *
 * @example Route que redirige aquí
 * ```typescript
 * {
 *   path: 'agenda',
 *   canActivate: [contextGuard],
 *   data: {
 *     requiredContext: 'PROFESIONAL',
 *     redirectTo: '/unauthorized', // <-- Redirige aquí
 *   },
 * }
 * ```
 */
@Component({
  selector: 'app-unauthorized-page',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="error-page">
      <mat-card class="error-card">
        <mat-card-content>
          <div class="error-icon">
            <mat-icon color="warn">lock</mat-icon>
          </div>
          <h1>Acceso No Autorizado</h1>
          <p class="error-code">401 Unauthorized</p>
          <p class="error-message">
            No tienes el contexto necesario para acceder a esta sección.
          </p>
          <p class="error-hint">
            Puede que necesites cambiar a un perfil diferente (cliente o
            profesional).
          </p>

          <div class="error-actions">
            <button mat-raised-button color="primary" (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              Volver Atrás
            </button>
            <button mat-stroked-button (click)="goHome()">
              <mat-icon>home</mat-icon>
              Ir al Inicio
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .error-page {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 1rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .error-card {
        max-width: 500px;
        text-align: center;
      }

      .error-icon {
        margin: 2rem 0 1rem;
      }

      .error-icon mat-icon {
        font-size: 80px;
        width: 80px;
        height: 80px;
      }

      h1 {
        margin: 0.5rem 0;
        font-size: 2rem;
        font-weight: 500;
      }

      .error-code {
        font-size: 1rem;
        color: rgba(0, 0, 0, 0.54);
        margin: 0.5rem 0;
      }

      .error-message {
        font-size: 1.1rem;
        margin: 1rem 0;
      }

      .error-hint {
        font-size: 0.9rem;
        color: rgba(0, 0, 0, 0.6);
        margin-bottom: 2rem;
      }

      .error-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }

      .error-actions button {
        min-width: 150px;
      }
    `,
  ],
})
export class UnauthorizedPage {
  private readonly router = inject(Router);

  goBack(): void {
    window.history.back();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
