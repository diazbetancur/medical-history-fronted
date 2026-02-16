import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-professional-dashboard',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <div class="dashboard-container">
      <h1>Dashboard Profesional</h1>

      <div class="dashboard-grid">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Citas Hoy</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="metric">8</p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Pacientes Activos</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="metric">127</p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Notas Pendientes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="metric">5</p>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Ingresos del Mes</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="metric">$12,450</p>
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
export class ProfessionalDashboardPage {}
