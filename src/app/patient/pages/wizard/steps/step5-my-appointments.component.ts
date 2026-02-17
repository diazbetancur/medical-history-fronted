import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ApiError, getUserMessage } from '@core/http/api-error';
import { ToastService } from '@core/ui/toast.service';
import {
  AppointmentDto,
  canCancelAppointment,
  getStatusColor,
  getStatusLabel,
} from '../../../models/appointment.dto';
import { AppointmentsService } from '../../../services/appointments.service';

@Component({
  selector: 'app-step5-my-appointments',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  template: `
    <div class="step-container">
      <h2>Mis Citas Médicas</h2>
      <p class="subtitle">Aquí puedes ver todas tus citas programadas</p>

      @if (isLoading()) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando citas...</p>
        </div>
      } @else if (appointments().length === 0) {
        <!-- Empty state -->
        <mat-card class="empty-state">
          <mat-card-content>
            <mat-icon>event_available</mat-icon>
            <h3>No tienes citas programadas</h3>
            <p>¡Reserva tu primera cita con un profesional!</p>
            <button
              mat-raised-button
              color="primary"
              (click)="bookAnother.emit()"
            >
              Reservar Cita
            </button>
          </mat-card-content>
        </mat-card>
      } @else {
        <!-- Appointments table -->
        <mat-card>
          <mat-card-content>
            <div class="table-container">
              <table mat-table [dataSource]="appointments()">
                <!-- Date Column -->
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Fecha</th>
                  <td mat-cell *matCellDef="let appointment">
                    <div class="date-cell">
                      <mat-icon>event</mat-icon>
                      {{ formatDate(appointment.date) }}
                    </div>
                  </td>
                </ng-container>

                <!-- Time Column -->
                <ng-container matColumnDef="time">
                  <th mat-header-cell *matHeaderCellDef>Horario</th>
                  <td mat-cell *matCellDef="let appointment">
                    <div class="time-cell">
                      <mat-icon>schedule</mat-icon>
                      {{
                        formatTime(appointment.startTime, appointment.endTime)
                      }}
                    </div>
                  </td>
                </ng-container>

                <!-- Professional Column -->
                <ng-container matColumnDef="professional">
                  <th mat-header-cell *matHeaderCellDef>Profesional</th>
                  <td mat-cell *matCellDef="let appointment">
                    <div class="professional-cell">
                      <strong>{{ appointment.professional.name }}</strong>
                      <span class="specialty">{{
                        appointment.professional.specialty
                      }}</span>
                    </div>
                  </td>
                </ng-container>

                <!-- Status Column -->
                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Estado</th>
                  <td mat-cell *matCellDef="let appointment">
                    <mat-chip
                      [style.background]="getStatusColor(appointment.status)"
                      [style.color]="'white'"
                    >
                      {{ getStatusLabel(appointment.status) }}
                    </mat-chip>
                  </td>
                </ng-container>

                <!-- Actions Column -->
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Acciones</th>
                  <td mat-cell *matCellDef="let appointment">
                    @if (canCancelAppointment(appointment)) {
                      <button
                        mat-icon-button
                        color="warn"
                        (click)="onCancelClick(appointment)"
                        matTooltip="Cancelar cita"
                      >
                        <mat-icon>cancel</mat-icon>
                      </button>
                    } @else {
                      <span class="no-actions">-</span>
                    }
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr
                  mat-row
                  *matRowDef="let row; columns: displayedColumns"
                ></tr>
              </table>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Action buttons -->
        <div class="actions">
          <button
            mat-raised-button
            color="primary"
            (click)="bookAnother.emit()"
          >
            <mat-icon>add</mat-icon>
            Reservar Otra Cita
          </button>
        </div>
      }
    </div>

    <!-- Cancel confirmation dialog (inline) -->
    @if (appointmentToCancel()) {
      <div class="dialog-backdrop" (click)="closeDialog()">
        <div class="dialog-content" (click)="$event.stopPropagation()">
          <h2>Cancelar Cita</h2>
          <p>
            ¿Estás seguro de que deseas cancelar tu cita con
            <strong>{{ appointmentToCancel()!.professional.name }}</strong> el
            día <strong>{{ formatDate(appointmentToCancel()!.date) }}</strong
            >?
          </p>
          <p class="warning">Esta acción no se puede deshacer.</p>
          <div class="dialog-actions">
            <button mat-button (click)="closeDialog()">
              No, mantener cita
            </button>
            <button
              mat-raised-button
              color="warn"
              (click)="confirmCancel()"
              [disabled]="isCancelling()"
            >
              @if (isCancelling()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Sí, cancelar
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .step-container {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }

      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 500;
      }

      .subtitle {
        margin: 0 0 24px 0;
        color: var(--color-text-secondary);
      }

      .loading {
        text-align: center;
        padding: 48px;

        p {
          margin-top: 16px;
        }
      }

      .empty-state {
        text-align: center;
        padding: 48px;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: var(--color-text-disabled);
          margin-bottom: 16px;
        }

        h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
        }

        p {
          margin: 0 0 24px 0;
          color: var(--color-text-secondary);
        }
      }

      .table-container {
        overflow-x: auto;

        table {
          width: 100%;

          th {
            font-weight: 500;
            color: var(--color-text-primary);
          }

          .date-cell,
          .time-cell {
            display: flex;
            align-items: center;
            gap: 8px;

            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
              color: var(--color-text-secondary);
            }
          }

          .professional-cell {
            display: flex;
            flex-direction: column;

            strong {
              margin-bottom: 4px;
            }

            .specialty {
              font-size: 12px;
              color: var(--color-text-secondary);
            }
          }

          mat-chip {
            border-radius: 16px;
            font-size: 12px;
            font-weight: 500;
          }

          .no-actions {
            color: var(--color-text-disabled);
          }
        }
      }

      .actions {
        margin-top: 24px;
        display: flex;
        justify-content: center;

        button[mat-raised-button] {
          mat-icon {
            margin-right: 8px;
          }
        }
      }

      /* Dialog styles */
      .dialog-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--color-text-tertiary);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .dialog-content {
        background: white;
        padding: 24px;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;

        h2 {
          margin: 0 0 16px 0;
          font-size: 20px;
        }

        p {
          margin: 0 0 16px 0;
        }

        .warning {
          color: var(--color-error);
          font-weight: 500;
        }

        .dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;

          button[mat-raised-button] {
            min-width: 120px;

            mat-spinner {
              display: inline-block;
              margin: 0 auto;
            }
          }
        }
      }

      @media (max-width: 768px) {
        .table-container {
          table {
            font-size: 14px;
          }
        }
      }
    `,
  ],
})
export class Step5MyAppointmentsComponent implements OnInit {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly toast = inject(ToastService);

  // Outputs
  readonly bookAnother = output<void>();

  // State
  readonly isLoading = signal(true);
  readonly appointments = signal<AppointmentDto[]>([]);
  readonly appointmentToCancel = signal<AppointmentDto | null>(null);
  readonly isCancelling = signal(false);

  // Table config
  readonly displayedColumns = [
    'date',
    'time',
    'professional',
    'status',
    'actions',
  ];

  ngOnInit(): void {
    this.loadAppointments();
  }

  /**
   * Load appointments
   */
  private loadAppointments(): void {
    this.isLoading.set(true);

    this.appointmentsService
      .getMyAppointments({ page: 1, pageSize: 50 })
      .subscribe({
        next: (response) => {
          this.appointments.set(response.appointments);
          this.isLoading.set(false);
        },
        error: (error: ApiError) => {
          this.isLoading.set(false);
          this.toast.error(getUserMessage(error));
        },
      });
  }

  /**
   * Format date for display
   */
  formatDate(dateStr: string): string {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateStr;
    }
  }

  /**
   * Format time for display
   */
  formatTime(startTime: string, endTime: string): string {
    return `${startTime} - ${endTime}`;
  }

  /**
   * Get status label (Spanish)
   */
  getStatusLabel(status: string): string {
    return getStatusLabel(status as any);
  }

  /**
   * Get status color
   */
  getStatusColor(status: string): string {
    return getStatusColor(status as any) || 'var(--color-text-disabled)';
  }

  /**
   * Check if appointment can be cancelled
   */
  canCancelAppointment(appointment: AppointmentDto): boolean {
    return canCancelAppointment(appointment);
  }

  /**
   * Cancel button clicked
   */
  onCancelClick(appointment: AppointmentDto): void {
    this.appointmentToCancel.set(appointment);
  }

  /**
   * Close cancel dialog
   */
  closeDialog(): void {
    if (!this.isCancelling()) {
      this.appointmentToCancel.set(null);
    }
  }

  /**
   * Confirm cancellation
   */
  confirmCancel(): void {
    const appointment = this.appointmentToCancel();
    if (!appointment) return;

    this.isCancelling.set(true);

    this.appointmentsService.cancelAppointment(appointment.id).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.appointmentToCancel.set(null);
        this.toast.success('Cita cancelada exitosamente');
        // Reload appointments
        this.loadAppointments();
      },
      error: (error: ApiError) => {
        this.isCancelling.set(false);
        this.toast.error(getUserMessage(error));
      },
    });
  }
}
