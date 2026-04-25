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
    return new Date(value).toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
