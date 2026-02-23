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
  templateUrl: './unauthorized.page.html',
  styleUrl: './unauthorized.page.scss',
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
