import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { ApiError, getUserMessage } from '@core/http/api-error';
import { ToastService } from '@shared/services/toast.service';
import { AppointmentDto } from '../../models/appointment.dto';
import { AppointmentsService } from '../../services/appointments.service';

@Component({
  selector: 'app-patient-home',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  template: `
    <div class="patient-home">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <h1>Bienvenido a Directory Pro</h1>
          <p class="subtitle">
            Gestiona tus citas médicas de manera fácil y rápida
          </p>
          <button
            mat-raised-button
            color="primary"
            class="cta-button"
            (click)="navigateToWizard()"
          >
            <mat-icon>add_circle_outline</mat-icon>
            Agendar Nueva Cita
          </button>
        </div>
      </section>

      <!-- Upcoming Appointments Section -->
      <section class="upcoming-section">
        <div class="section-header">
          <h2>Próximas Citas</h2>
          @if (upcomingAppointments().length > 0) {
            <button mat-button (click)="viewAllAppointments()">
              Ver todas
              <mat-icon>arrow_forward</mat-icon>
            </button>
          }
        </div>

        <!-- Loading State -->
        @if (isLoading()) {
          <div class="loading">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Cargando citas...</p>
          </div>
        }

        <!-- Empty State -->
        @if (!isLoading() && upcomingAppointments().length === 0) {
          <mat-card class="empty-state">
            <mat-card-content>
              <mat-icon>event_available</mat-icon>
              <h3>No tienes citas próximas</h3>
              <p>¡Agenda tu primera cita con nuestros profesionales!</p>
              <button
                mat-raised-button
                color="primary"
                (click)="navigateToWizard()"
              >
                <mat-icon>add</mat-icon>
                Agendar Ahora
              </button>
            </mat-card-content>
          </mat-card>
        }

        <!-- Appointments Grid -->
        @if (!isLoading() && upcomingAppointments().length > 0) {
          <div class="appointments-grid">
            @for (apt of upcomingAppointments(); track apt.id) {
              <mat-card class="appointment-card">
                <mat-card-content>
                  <div class="appointment-header">
                    <!-- Professional Avatar -->
                    <div class="professional-avatar">
                      @if (apt.professional.photoUrl) {
                        <img
                          [src]="apt.professional.photoUrl"
                          [alt]="apt.professional.name"
                        />
                      } @else {
                        <mat-icon>person</mat-icon>
                      }
                    </div>

                    <!-- Appointment Info -->
                    <div class="appointment-info">
                      <h3>{{ apt.professional.name }}</h3>
                      <p class="specialty">{{ apt.professional.specialty }}</p>

                      <div class="appointment-meta">
                        <span class="date">
                          <mat-icon>event</mat-icon>
                          {{ formatDate(apt.date) }}
                        </span>
                        <span class="time">
                          <mat-icon>schedule</mat-icon>
                          {{ apt.startTime }}
                        </span>
                      </div>

                      <!-- Status Badge -->
                      <mat-chip-set>
                        <mat-chip [class]="'status-' + apt.status">
                          {{ getStatusLabel(apt.status) }}
                        </mat-chip>
                      </mat-chip-set>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="appointment-actions">
                    <button
                      mat-button
                      color="warn"
                      (click)="cancelAppointment(apt.id)"
                    >
                      <mat-icon>cancel</mat-icon>
                      Cancelar
                    </button>
                    <button mat-button color="primary" disabled>
                      <mat-icon>info</mat-icon>
                      Detalles
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        }
      </section>

      <!-- Quick Actions Section -->
      <section class="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div class="actions-grid">
          <mat-card class="action-card" (click)="navigateToWizard()">
            <mat-card-content>
              <mat-icon>add_circle</mat-icon>
              <h3>Agendar Cita</h3>
              <p>Reserva una nueva cita</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="action-card" (click)="viewAllAppointments()">
            <mat-card-content>
              <mat-icon>event_note</mat-icon>
              <h3>Mis Citas</h3>
              <p>Ver todas mis citas</p>
            </mat-card-content>
          </mat-card>

          <mat-card class="action-card" disabled>
            <mat-card-content>
              <mat-icon>person</mat-icon>
              <h3>Mi Perfil</h3>
              <p>Actualizar información</p>
            </mat-card-content>
          </mat-card>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .patient-home {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      /* Hero Section */
      .hero {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 60px 40px;
        border-radius: 16px;
        margin-bottom: 32px;
        text-align: center;

        .hero-content {
          max-width: 800px;
          margin: 0 auto;

          h1 {
            margin: 0 0 16px 0;
            font-size: 42px;
            font-weight: 700;
          }

          .subtitle {
            margin: 0 0 32px 0;
            font-size: 18px;
            opacity: 0.95;
          }

          .cta-button {
            height: 56px;
            padding: 0 32px;
            font-size: 16px;
            font-weight: 600;

            mat-icon {
              margin-right: 8px;
            }
          }
        }
      }

      /* Section Header */
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;

        h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }

        button mat-icon {
          margin-left: 8px;
        }
      }

      /* Loading State */
      .loading {
        text-align: center;
        padding: 60px 24px;

        p {
          margin-top: 16px;
          color: rgba(0, 0, 0, 0.6);
        }
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 60px 24px;

        mat-icon {
          font-size: 80px;
          width: 80px;
          height: 80px;
          color: rgba(0, 0, 0, 0.38);
          margin-bottom: 16px;
        }

        h3 {
          margin: 0 0 8px 0;
          font-size: 24px;
        }

        p {
          margin: 0 0 24px 0;
          color: rgba(0, 0, 0, 0.6);
        }

        button mat-icon {
          margin-right: 8px;
        }
      }

      /* Appointments Grid */
      .appointments-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 24px;
        margin-bottom: 48px;
      }

      .appointment-card {
        transition:
          transform 0.2s,
          box-shadow 0.2s;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }

        .appointment-header {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .professional-avatar {
          flex-shrink: 0;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--mat-sys-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          mat-icon {
            color: white;
            font-size: 32px;
            width: 32px;
            height: 32px;
          }
        }

        .appointment-info {
          flex: 1;

          h3 {
            margin: 0 0 4px 0;
            font-size: 18px;
            font-weight: 600;
          }

          .specialty {
            margin: 0 0 12px 0;
            font-size: 14px;
            color: rgba(0, 0, 0, 0.6);
          }

          .appointment-meta {
            display: flex;
            gap: 16px;
            margin-bottom: 12px;
            font-size: 14px;

            span {
              display: flex;
              align-items: center;
              gap: 4px;

              mat-icon {
                font-size: 18px;
                width: 18px;
                height: 18px;
              }
            }
          }

          mat-chip-set {
            margin: 0;
          }

          mat-chip {
            &.status-CONFIRMED {
              background: #4caf50 !important;
              color: white;
            }

            &.status-PENDING {
              background: #ff9800 !important;
              color: white;
            }

            &.status-CANCELLED {
              background: #f44336 !important;
              color: white;
            }
          }
        }

        .appointment-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid rgba(0, 0, 0, 0.12);

          button mat-icon {
            margin-right: 4px;
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }

      /* Quick Actions */
      .quick-actions {
        h2 {
          margin: 0 0 24px 0;
          font-size: 28px;
          font-weight: 600;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }

        .action-card {
          cursor: pointer;
          text-align: center;
          transition:
            transform 0.2s,
            box-shadow 0.2s;

          &:hover:not([disabled]) {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
          }

          &[disabled] {
            opacity: 0.6;
            cursor: not-allowed;
          }

          mat-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
            color: var(--mat-sys-primary);
            margin-bottom: 12px;
          }

          h3 {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 600;
          }

          p {
            margin: 0;
            color: rgba(0, 0, 0, 0.6);
            font-size: 14px;
          }
        }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .patient-home {
          padding: 16px;
        }

        .hero {
          padding: 40px 24px;

          .hero-content h1 {
            font-size: 32px;
          }

          .cta-button {
            width: 100%;
          }
        }

        .appointments-grid {
          grid-template-columns: 1fr;
        }

        .section-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }
      }
    `,
  ],
})
export class PatientHomeComponent implements OnInit {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  // State
  readonly isLoading = signal(false);
  readonly allAppointments = signal<AppointmentDto[]>([]);

  // Computed: Filter only upcoming appointments
  readonly upcomingAppointments = computed(() => {
    const now = new Date();
    return this.allAppointments()
      .filter((apt) => {
        const aptDate = new Date(`${apt.date}T${apt.startTime}`);
        return (
          aptDate > now &&
          (apt.status === 'PENDING' || apt.status === 'CONFIRMED')
        );
      })
      .slice(0, 6); // Show max 6 upcoming appointments
  });

  ngOnInit(): void {
    this.loadUpcomingAppointments();
  }

  /**
   * Load upcoming appointments
   */
  private loadUpcomingAppointments(): void {
    this.isLoading.set(true);

    this.appointmentsService
      .getMyAppointments({ page: 1, pageSize: 20 })
      .subscribe({
        next: (response) => {
          this.allAppointments.set(response.appointments);
          this.isLoading.set(false);
        },
        error: (error: ApiError) => {
          this.isLoading.set(false);
          this.toast.error(getUserMessage(error));
        },
      });
  }

  /**
   * Navigate to wizard to create new appointment
   */
  navigateToWizard(): void {
    this.router.navigate(['/patient/wizard']);
  }

  /**
   * Navigate to all appointments view
   */
  viewAllAppointments(): void {
    this.router.navigate(['/patient/wizard'], {
      queryParams: { step: 5 },
    });
  }

  /**
   * Cancel appointment
   */
  cancelAppointment(appointmentId: string): void {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      return;
    }

    this.appointmentsService.cancelAppointment(appointmentId).subscribe({
      next: () => {
        this.toast.success('Cita cancelada exitosamente');
        this.loadUpcomingAppointments(); // Reload list
      },
      error: (error: ApiError) => {
        this.toast.error(getUserMessage(error));
      },
    });
  }

  /**
   * Format date for display
   */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Get status label in Spanish
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      CANCELLED: 'Cancelada',
      COMPLETED: 'Completada',
      NO_SHOW: 'No Asistió',
    };
    return labels[status] || status;
  }
}
