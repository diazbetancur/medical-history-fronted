import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <div class="dashboard-container">
      <h1>Dashboard de Administración</h1>

      <div class="dashboard-grid">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Usuarios Totales</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="metric">1,234</p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Profesionales Activos</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="metric">567</p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Solicitudes Pendientes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="metric">42</p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Citas del Mes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="metric">789</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        padding: 0;

        h1 {
          margin: 0 0 24px;
          font-size: 2rem;
          font-weight: 500;
        }
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 24px;
      }

      .metric {
        font-size: 3rem;
        font-weight: 700;
        color: var(--primary-color);
        margin: 16px 0 0;
      }
    `,
  ],
})
export class AdminDashboardPage {}
