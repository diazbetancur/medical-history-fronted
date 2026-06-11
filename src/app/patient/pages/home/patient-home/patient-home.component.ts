import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { PushOptInBannerComponent } from '@shared/ui/push-opt-in-banner/push-opt-in-banner.component';
import { AppointmentDto } from '../../../models/appointment.dto';
import { AppointmentsService } from '../../../services/appointments.service';
import { AppointmentDetailDialogComponent } from '../appointment-detail-dialog/appointment-detail-dialog.component';

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
    PushOptInBannerComponent,
  ],
  templateUrl: './patient-home.component.html',
  styleUrl: './patient-home.component.scss',
})
export class PatientHomeComponent implements OnInit {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  readonly isLoading = signal(false);
  readonly allAppointments = signal<AppointmentDto[]>([]);

  readonly upcomingAppointments = computed(() => {
    const now = new Date();
    return this.allAppointments()
      .filter((apt) => {
        const aptDate = new Date(`${apt.date}T${apt.startTime}`);
        return (
          aptDate > now &&
          (apt.status === 'PENDING' ||
            apt.status === 'CONFIRMED' ||
            apt.status === 'RESCHEDULED')
        );
      })
      .sort(
        (left, right) =>
          new Date(`${left.date}T${left.startTime}`).getTime() -
          new Date(`${right.date}T${right.startTime}`).getTime(),
      )
      .slice(0, 2);
  });

  ngOnInit(): void {
    this.loadUpcomingAppointments();
  }

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

  navigateToWizard(): void {
    this.router.navigate(['/patient/wizard']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/patient/profile']);
  }

  viewAllAppointments(): void {
    this.router.navigate(['/patient/appointments']);
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
          this.loadUpcomingAppointments();
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
      RESCHEDULED: 'Reprogramada',
      CANCELLED: 'Cancelada',
      COMPLETED: 'Completada',
      NO_SHOW: 'No Asistió',
    };
    return labels[status] || status;
  }
}
