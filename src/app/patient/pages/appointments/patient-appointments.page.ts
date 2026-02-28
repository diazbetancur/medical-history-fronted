import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { ApiError, getUserMessage } from '@core/http/api-error';
import { ToastService } from '@shared/services/toast.service';
import { ConfirmDialogComponent } from '@shared/ui';
import { AppointmentDto } from '../../models/appointment.dto';
import { AppointmentsService } from '../../services/appointments.service';
import { AppointmentDetailDialogComponent } from '../home/appointment-detail-dialog.component';

@Component({
  selector: 'app-patient-appointments-page',
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
    <div class="appointments-page">
      <header class="page-header">
        <h1>Todas mis citas próximas</h1>
        <button mat-button (click)="navigateToDashboard()">
          <mat-icon>arrow_back</mat-icon>
          Volver al dashboard
        </button>
      </header>

      @if (isLoading()) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando citas...</p>
        </div>
      }

      @if (!isLoading() && upcomingAppointments().length === 0) {
        <mat-card class="empty-state">
          <mat-card-content>
            <mat-icon>event_available</mat-icon>
            <h3>No tienes citas próximas</h3>
            <p>Agenda una nueva cita para verla aquí.</p>
            <button mat-raised-button color="primary" (click)="navigateToWizard()">
              Agendar cita
            </button>
          </mat-card-content>
        </mat-card>
      }

      @if (!isLoading() && upcomingAppointments().length > 0) {
        <div class="appointments-grid">
          @for (apt of upcomingAppointments(); track apt.id) {
            <mat-card class="appointment-card">
              <mat-card-content>
                <div class="appointment-header">
                  <div class="professional-avatar">
                    @if (apt.professional.photoUrl) {
                      <img [src]="apt.professional.photoUrl" [alt]="apt.professional.name" />
                    } @else {
                      <mat-icon>person</mat-icon>
                    }
                  </div>

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

                    <mat-chip-set>
                      <mat-chip [class]="'status-' + apt.status">
                        {{ getStatusLabel(apt.status) }}
                      </mat-chip>
                    </mat-chip-set>
                  </div>
                </div>

                <div class="appointment-actions">
                  <button mat-button color="warn" (click)="cancelAppointment(apt.id)">
                    <mat-icon>cancel</mat-icon>
                    Cancelar
                  </button>
                  <button mat-button color="primary" (click)="viewAppointmentDetail(apt.id)">
                    <mat-icon>info</mat-icon>
                    Detalles
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .appointments-page {
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;

        h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }

        button mat-icon {
          margin-right: 8px;
        }
      }

      .loading {
        text-align: center;
        padding: 60px 24px;

        p {
          margin-top: 16px;
          color: var(--color-text-secondary);
        }
      }

      .empty-state {
        text-align: center;
        padding: 60px 24px;

        mat-icon {
          font-size: 80px;
          width: 80px;
          height: 80px;
          color: var(--color-text-disabled);
          margin-bottom: 16px;
        }

        h3 {
          margin: 0 0 8px 0;
          font-size: 24px;
        }

        p {
          margin: 0 0 24px 0;
          color: var(--color-text-secondary);
        }
      }

      .appointments-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 24px;
      }

      .appointment-card {
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
            color: var(--color-text-inverted);
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
            color: var(--color-text-secondary);
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

          mat-chip {
            &.status-CONFIRMED {
              background: var(--color-success) !important;
              color: var(--color-text-inverted);
            }

            &.status-PENDING {
              background: var(--color-warning) !important;
              color: var(--color-text-inverted);
            }

            &.status-CANCELLED {
              background: var(--color-error) !important;
              color: var(--color-text-inverted);
            }
          }
        }

        .appointment-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid var(--color-border);

          button mat-icon {
            margin-right: 4px;
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
        }
      }

      @media (max-width: 768px) {
        .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }

        .appointments-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PatientAppointmentsPageComponent implements OnInit {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly isLoading = signal(false);
  readonly allAppointments = signal<AppointmentDto[]>([]);

  readonly upcomingAppointments = computed(() => {
    const now = new Date();

    return this.allAppointments()
      .filter((appointment) => {
        const appointmentDate = new Date(
          `${appointment.date}T${appointment.startTime}`,
        );
        return (
          appointmentDate > now &&
          (appointment.status === 'PENDING' ||
            appointment.status === 'CONFIRMED')
        );
      })
      .sort(
        (left, right) =>
          new Date(`${left.date}T${left.startTime}`).getTime() -
          new Date(`${right.date}T${right.startTime}`).getTime(),
      );
  });

  ngOnInit(): void {
    this.loadAllUpcomingAppointments();
  }

  private loadAllUpcomingAppointments(page = 1, collected: AppointmentDto[] = []): void {
    if (page === 1) {
      this.isLoading.set(true);
    }

    this.appointmentsService
      .getMyAppointments({ page, pageSize: 50 })
      .subscribe({
        next: (response) => {
          const merged = [...collected, ...response.appointments];
          const loadedAll = merged.length >= response.total;
          const hasMore = response.appointments.length > 0;

          if (!loadedAll && hasMore) {
            this.loadAllUpcomingAppointments(page + 1, merged);
            return;
          }

          this.allAppointments.set(merged);
          this.isLoading.set(false);
        },
        error: (error: ApiError) => {
          this.isLoading.set(false);
          this.toast.error(getUserMessage(error));
        },
      });
  }

  navigateToDashboard(): void {
    this.router.navigate(['/patient']);
  }

  navigateToWizard(): void {
    this.router.navigate(['/patient/wizard']);
  }

  viewAppointmentDetail(appointmentId: string): void {
    this.dialog.open(AppointmentDetailDialogComponent, {
      width: '640px',
      maxWidth: '96vw',
      data: { appointmentId },
    });
  }

  cancelAppointment(appointmentId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Cancelar cita',
        message: '¿Estás seguro de que deseas cancelar esta cita?',
        confirmText: 'Cancelar cita',
        cancelText: 'Volver',
        confirmColor: 'warn',
        icon: 'event_busy',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.appointmentsService.cancelAppointment(appointmentId).subscribe({
        next: () => {
          this.toast.success('Cita cancelada exitosamente');
          this.loadAllUpcomingAppointments();
        },
        error: (error: ApiError) => {
          this.toast.error(getUserMessage(error));
        },
      });
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

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
