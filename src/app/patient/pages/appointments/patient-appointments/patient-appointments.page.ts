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
import { AppointmentDto } from '../../../models/appointment.dto';
import { AppointmentsService } from '../../../services/appointments.service';
import { AppointmentDetailDialogComponent } from '../../home/appointment-detail-dialog/appointment-detail-dialog.component';

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
  templateUrl: './patient-appointments.page.html',
  styleUrl: './patient-appointments.page.scss',
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

  private loadAllUpcomingAppointments(
    page = 1,
    collected: AppointmentDto[] = [],
  ): void {
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
