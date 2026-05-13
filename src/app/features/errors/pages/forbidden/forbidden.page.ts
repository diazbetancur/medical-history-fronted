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
  templateUrl: './forbidden.page.html',
  styleUrl: './forbidden.page.scss',
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
