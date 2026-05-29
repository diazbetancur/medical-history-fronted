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
} from '../../../services/appointments.service';

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
  templateUrl: './appointment-detail-dialog.component.html',
  styleUrl: './appointment-detail-dialog.component.scss',
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
    this.appointmentsService
      .getMyAppointmentById(this.data.appointmentId)
      .subscribe({
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
    // Parse YYYY-MM-DD as local time to avoid UTC offset shifting the day
    const parts = value.split('T')[0].split('-').map(Number);
    const date = parts.length === 3
      ? new Date(parts[0], parts[1] - 1, parts[2])
      : new Date(value);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
