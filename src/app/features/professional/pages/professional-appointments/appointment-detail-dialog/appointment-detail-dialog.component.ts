import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProfessionalAppointmentsApi } from '@data/api/professional-appointments.api';
import {
  EXTERNAL_SOURCE_LABELS,
  type AppointmentDto,
  type AppointmentStatus,
  type ExternalAppointmentSource,
} from '@data/models/appointment.models';

export interface AppointmentDetailDialogData {
  appointmentId: string;
  professionalProfileId: string;
  initialAppointment?: AppointmentDto;
}

@Component({
  selector: 'app-professional-appointment-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './appointment-detail-dialog.component.html',
  styleUrl: './appointment-detail-dialog.component.scss',
})
export class AppointmentDetailDialogComponent implements OnInit {
  private readonly api = inject(ProfessionalAppointmentsApi);
  private readonly dialogRef = inject(
    MatDialogRef<AppointmentDetailDialogComponent>,
  );
  readonly data = inject<AppointmentDetailDialogData>(MAT_DIALOG_DATA);

  readonly appointment = signal<AppointmentDto | null>(
    this.data.initialAppointment ?? null,
  );
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAppointmentDetail();
  }

  close(): void {
    this.dialogRef.close();
  }

  isExternalAppointment(appointment: AppointmentDto | null): boolean {
    return appointment?.type === 'EXTERNAL';
  }

  getStatusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      CANCELLED: 'Cancelada',
      COMPLETED: 'Completada',
      NO_SHOW: 'No asistió',
    };
    return labels[status];
  }

  getExternalSourceLabel(
    source: ExternalAppointmentSource | undefined,
  ): string {
    return source ? EXTERNAL_SOURCE_LABELS[source] : 'No especificado';
  }

  formatDate(date: string): string {
    if (!date) return 'No disponible';
    const [year, month, day] = date.split('-');
    return new Date(+year, +month - 1, +day).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatDateTime(value: string | undefined): string {
    if (!value) return 'No disponible';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'No disponible';
    return date.toLocaleString('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  hasClinicalInfo(appointment: AppointmentDto): boolean {
    return [
      appointment.reason,
      appointment.patientNotes,
      appointment.professionalNotes,
      appointment.notes,
      appointment.observation,
      appointment.externalNotes,
      appointment.cancellationReason,
    ].some((value) => !!value?.trim());
  }

  private loadAppointmentDetail(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.api
      .getAppointmentById(
        this.data.professionalProfileId,
        this.data.appointmentId,
      )
      .subscribe({
        next: (appointment) => {
          this.appointment.set(appointment);
          this.isLoading.set(false);
        },
        error: (error: { error?: { title?: string; detail?: string } }) => {
          this.errorMessage.set(
            error?.error?.detail ||
              error?.error?.title ||
              'No fue posible cargar el detalle de la cita.',
          );
          this.isLoading.set(false);
        },
      });
  }
}
