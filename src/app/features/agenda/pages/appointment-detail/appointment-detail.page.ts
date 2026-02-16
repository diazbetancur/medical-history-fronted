import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentsApi, type Appointment } from '@data/api';
import { CancelAppointmentDialogComponent } from './cancel-appointment-dialog.component';

/**
 * Appointment Detail Page
 *
 * Shows details of a specific appointment.
 * Allows:
 * - View all appointment information
 * - Cancel appointment (if pending/confirmed)
 * - Export to calendar (ICS)
 * - Back to list
 */
@Component({
  selector: 'app-appointment-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDialogModule,
    MatDividerModule,
  ],
  templateUrl: './appointment-detail.page.html',
  styleUrl: './appointment-detail.page.scss',
})
export class AppointmentDetailPageComponent implements OnInit {
  private readonly appointmentsApi = inject(AppointmentsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  // State
  readonly loading = signal(true);
  readonly appointment = signal<Appointment | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadAppointment(id);
    } else {
      this.router.navigate(['/dashboard/agenda']);
    }
  }

  /**
   * Load appointment details
   */
  loadAppointment(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.appointmentsApi.getById(id).subscribe({
      next: (appointment) => {
        this.appointment.set(appointment);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar la cita');
        this.loading.set(false);
      },
    });
  }

  /**
   * Open cancel dialog
   */
  openCancelDialog(): void {
    const appointment = this.appointment();
    if (!appointment) return;

    const dialogRef = this.dialog.open(CancelAppointmentDialogComponent, {
      width: '400px',
      data: { appointmentId: appointment.id },
    });

    dialogRef.afterClosed().subscribe((cancelled: boolean) => {
      if (cancelled) {
        // Reload appointment to show updated status
        this.loadAppointment(appointment.id);
      }
    });
  }

  /**
   * Export to calendar
   */
  exportToCalendar(): void {
    const appointment = this.appointment();
    if (appointment) {
      this.appointmentsApi.exportIcs(appointment.id);
    }
  }

  /**
   * Back to list
   */
  goBack(): void {
    this.router.navigate(['/dashboard/agenda']);
  }

  /**
   * Convert UTC time to local time
   * Returns empty string if time is undefined
   */
  toLocalTime(utcTime: string | undefined): string {
    if (!utcTime) return '';
    const date = new Date(utcTime);
    return date.toLocaleString('es-ES', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): 'primary' | 'accent' | 'warn' | undefined {
    switch (status) {
      case 'confirmed':
        return 'primary';
      case 'pending':
        return 'accent';
      case 'cancelled':
        return 'warn';
      default:
        return undefined;
    }
  }

  /**
   * Get status text
   */
  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      completed: 'Completada',
      'no-show': 'No asistió',
    };

    return statusMap[status] || status;
  }

  /**
   * Check if appointment can be cancelled
   */
  canCancel(appointment: Appointment): boolean {
    return (
      appointment.status === 'pending' || appointment.status === 'confirmed'
    );
  }
}
