import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './dashboard-home.page.html',
  styleUrl: './dashboard-home.page.scss',
})
export class DashboardHomePageComponent {
  private readonly authService = inject(AuthService);

  get userName(): string {
    return this.authService.session().email?.split('@')[0] || 'Usuario';
  }

  recentActivities = [
    {
      id: 1,
      icon: 'inbox',
      text: 'Nueva solicitud de servicio recibida',
      time: 'Hace 2 horas',
    },
    {
      id: 2,
      icon: 'star',
      text: 'Nueva reseña de 5 estrellas',
      time: 'Hace 5 horas',
    },
    {
      id: 3,
      icon: 'visibility',
      text: 'Tu perfil fue visto 23 veces hoy',
      time: 'Hace 1 día',
    },
    {
      id: 4,
      icon: 'check_circle',
      text: 'Solicitud completada exitosamente',
      time: 'Hace 2 días',
    },
  ];
}
