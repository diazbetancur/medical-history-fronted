import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './admin-home.page.html',
  styleUrl: './admin-home.page.scss',
})
export class AdminHomePageComponent {
  stats = signal({
    totalProfessionals: 1847,
    pendingReview: 23,
    verifiedProfessionals: 1654,
    totalRequests: 12453,
  });

  recentActivities = [
    {
      id: 1,
      icon: 'person_add',
      type: 'new-user',
      text: 'Nuevo profesional registrado: María García',
      time: 'Hace 15 minutos',
    },
    {
      id: 2,
      icon: 'verified',
      type: 'verified',
      text: 'Profesional verificado: Carlos López',
      time: 'Hace 1 hora',
    },
    {
      id: 3,
      icon: 'flag',
      type: 'report',
      text: 'Nuevo reporte recibido',
      time: 'Hace 2 horas',
    },
    {
      id: 4,
      icon: 'person_add',
      type: 'new-user',
      text: 'Nuevo profesional registrado: Pedro Martínez',
      time: 'Hace 3 horas',
    },
    {
      id: 5,
      icon: 'verified',
      type: 'verified',
      text: 'Profesional verificado: Ana Rodríguez',
      time: 'Hace 5 horas',
    },
  ];
}
