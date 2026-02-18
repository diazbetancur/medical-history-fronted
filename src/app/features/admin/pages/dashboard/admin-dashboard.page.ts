import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminApi, getErrorMessage } from '@data/api';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [MatCardModule, MatProgressSpinnerModule],
  template: `
    <div class="dashboard-container">
      <h1>Dashboard de Administración</h1>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="42"></mat-spinner>
          <p>Cargando resumen...</p>
        </div>
      } @else if (error()) {
        <mat-card class="error-card">
          <mat-card-content>
            <p>{{ error() }}</p>
            <button mat-stroked-button (click)="loadSummary()">
              Reintentar
            </button>
          </mat-card-content>
        </mat-card>
      } @else {
        <div class="dashboard-grid">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Pacientes Activos</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="metric">{{ activePatients() }}</p>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>Profesionales Activos</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="metric">{{ activeProfessionalsNonAdmin() }}</p>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title
                >Solicitudes de Activación Pendientes</mat-card-title
              >
            </mat-card-header>
            <mat-card-content>
              <p class="metric">
                {{ pendingProfessionalActivationRequests() }}
              </p>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>Citas Solicitadas Este Mes</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p class="metric">{{ appointmentsRequestedThisMonth() }}</p>
            </mat-card-content>
          </mat-card>
        </div>

        <p class="generated-at">Actualizado: {{ generatedAtText() }}</p>
      }
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

      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 32px 0;
        color: var(--color-text-secondary);
      }

      .error-card {
        p {
          margin: 0 0 12px;
          color: var(--color-danger, #b3261e);
        }
      }

      .metric {
        font-size: 3rem;
        font-weight: 700;
        color: var(--primary-color);
        margin: 16px 0 0;
      }

      .generated-at {
        margin: 16px 0 0;
        color: var(--color-text-secondary);
        font-size: 0.9rem;
      }
    `,
  ],
})
export class AdminDashboardPage implements OnInit {
  private readonly adminApi = inject(AdminApi);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly summary = signal({
    activePatients: 0,
    activeProfessionalsNonAdmin: 0,
    appointmentsRequestedThisMonth: 0,
    pendingProfessionalActivationRequests: 0,
    generatedAtUtc: '',
  });

  readonly activePatients = computed(() => this.summary().activePatients);
  readonly activeProfessionalsNonAdmin = computed(
    () => this.summary().activeProfessionalsNonAdmin,
  );
  readonly appointmentsRequestedThisMonth = computed(
    () => this.summary().appointmentsRequestedThisMonth,
  );
  readonly pendingProfessionalActivationRequests = computed(
    () => this.summary().pendingProfessionalActivationRequests,
  );
  readonly generatedAtText = computed(() => {
    const value = this.summary().generatedAtUtc;
    if (!value) {
      return 'No disponible';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString();
  });

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminApi.getDashboardSummary().subscribe({
      next: (response) => {
        this.summary.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          getErrorMessage(err?.error ?? err) ||
            'No se pudo cargar el resumen del dashboard',
        );
        this.loading.set(false);
      },
    });
  }
}
