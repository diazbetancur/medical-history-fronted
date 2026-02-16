import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

/**
 * Página de error: Permiso Denegado (403/Forbidden)
 *
 * Mostrada cuando:
 * - permissionStoreGuard falla (usuario no tiene los permisos requeridos)
 * - Usuario intenta acceder a ruta sin permisos suficientes
 *
 * @example Route que redirige aquí
 * ```typescript
 * {
 *   path: 'admin/users',
 *   canActivate: [permissionStoreGuard],
 *   data: {
 *     requiredPermissions: ['Users.View'],
 *     redirectTo: '/forbidden', // <-- Redirige aquí
 *   },
 * }
 * ```
 */
@Component({
  selector: 'app-forbidden-page',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="error-page">
      <mat-card class="error-card">
        <mat-card-content>
          <div class="error-icon">
            <mat-icon color="warn">block</mat-icon>
          </div>
          <h1>Acceso Denegado</h1>
          <p class="error-code">403 Forbidden</p>
          <p class="error-message">
            No tienes permisos para acceder a esta sección.
          </p>
          <p class="error-hint">
            Si crees que deberías tener acceso, contacta con el administrador.
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
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
export class ForbiddenPage {
  private readonly router = inject(Router);

  goBack(): void {
    window.history.back();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
