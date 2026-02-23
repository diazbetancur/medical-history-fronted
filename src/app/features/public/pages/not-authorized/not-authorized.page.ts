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
  templateUrl: './not-authorized.page.html',
  styleUrl: './not-authorized.page.scss',
})
export class NotAuthorizedPageComponent {}
