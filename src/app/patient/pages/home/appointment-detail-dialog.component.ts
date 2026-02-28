import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiError, getUserMessage } from '@core/http/api-error';
import {
  AppointmentsService,
  MyAppointmentDetailDto,
} from '../../services/appointments.service';

@Component({
  selector: 'app-appointment-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>Detalle de cita</h2>

    <mat-dialog-content class="dialog-content">
      @if (loading()) {
        <div class="state-block">
          <mat-spinner diameter="32"></mat-spinner>
          <p>Cargando detalle...</p>
        </div>
      } @else if (error()) {
        <div class="state-block error">
          <mat-icon>error</mat-icon>
          <p>{{ error() }}</p>
        </div>
      } @else if (appointment()) {
        <mat-card>
          <mat-card-content>
            <div class="row">
              <strong>Profesional:</strong>
              <span>{{ appointment()!.professionalName }}</span>
            </div>

            <mat-divider></mat-divider>

            <div class="row">
              <strong>Dirección:</strong>
              <span>{{ appointment()!.address }}</span>
            </div>

            <mat-divider></mat-divider>

            <div class="row">
              <strong>Fecha:</strong>
              <span>{{ formatDate(appointment()!.appointmentDate) }}</span>
            </div>
            <div class="row">
              <strong>Hora:</strong>
              <span>{{ appointment()!.timeSlot || '-' }}</span>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="close()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-content {
        min-width: 520px;
        max-width: 100%;
      }

      .state-block {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        border-radius: 8px;
        background: var(--color-background-alt);
        color: var(--color-text-secondary);

        &.error {
          color: var(--color-danger);
        }
      }

      .row {
        display: grid;
        grid-template-columns: 110px 1fr;
        gap: 8px;
        font-size: 14px;
        margin-bottom: 10px;
        align-items: start;
      }

      mat-divider {
        margin: 10px 0 14px;
      }

      @media (max-width: 720px) {
        .dialog-content {
          min-width: auto;
        }

        .row {
          grid-template-columns: 1fr;
          gap: 4px;
        }
      }
    `,
  ],
})
export class AppointmentDetailDialogComponent implements OnInit {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly dialogRef = inject(
    MatDialogRef<AppointmentDetailDialogComponent>,
  );
  readonly data = inject<{ appointmentId: string }>(MAT_DIALOG_DATA);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly appointment = signal<MyAppointmentDetailDto | null>(null);

  ngOnInit(): void {
    this.appointmentsService.getMyAppointmentById(this.data.appointmentId).subscribe({
      next: (detail) => {
        this.appointment.set(detail);
        this.loading.set(false);
      },
      error: (error: ApiError) => {
        this.error.set(getUserMessage(error));
        this.loading.set(false);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }

  formatDate(value: string | undefined): string {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
