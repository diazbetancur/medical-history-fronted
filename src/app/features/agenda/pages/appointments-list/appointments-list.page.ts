import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AppointmentsApi, type Appointment } from '@data/api';
import {
  RequestAppointmentDialogComponent,
  SelectedProfessionalForBooking,
} from '../../../../patient/pages/home/request-appointment-dialog.component';
import { BookAppointmentDialogComponent } from '../../../public/components/book-appointment-dialog.component';

/**
 * Appointments List Page
 *
 * Shows upcoming appointments for current user.
 * Allows navigation to:
 * - Book new appointment
 * - View appointment details
 * - Cancel appointment (from list)
 *
 * Features:
 * - Loads upcoming appointments on init
 * - Shows loading spinner
 * - Displays appointments with local time conversion
 * - Status badges (pending, confirmed, etc.)
 */
@Component({
  selector: 'app-appointments-list-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDialogModule,
  ],
  templateUrl: './appointments-list.page.html',
  styleUrl: './appointments-list.page.scss',
})
export class AppointmentsListPageComponent implements OnInit {
  private readonly appointmentsApi = inject(AppointmentsApi);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  // State
  readonly loading = signal(true);
  readonly appointments = signal<Appointment[]>([]);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAppointments();
  }

  /**
   * Load upcoming appointments from API
   */
  loadAppointments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.appointmentsApi.getUpcoming().subscribe({
      next: (response) => {
        this.appointments.set(response.appointments);
        this.loading.set(false);
      },
      error: (error) => {
        // Error already handled by interceptor (toast shown)
        this.error.set('Error al cargar citas. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  /**
   * Navigate to booking page
   */
  bookNewAppointment(): void {
    const selectorRef = this.dialog.open(RequestAppointmentDialogComponent, {
      width: '980px',
      maxWidth: '96vw',
      data: {
        pageSize: 12,
      },
    });

    selectorRef
      .afterClosed()
      .subscribe((selected: SelectedProfessionalForBooking | null) => {
        if (!selected) {
          return;
        }

        this.dialog.open(BookAppointmentDialogComponent, {
          width: '760px',
          maxWidth: '96vw',
          data: {
            slug: selected.slug,
            professionalId: selected.professionalProfileId,
            name: selected.fullName,
            imageUrl: selected.photoUrl,
            specialties: selected.specialty ? [selected.specialty] : [],
          },
        });
      });
  }

  /**
   * View appointment details
   */
  viewDetails(appointmentId: string): void {
    this.router.navigate(['/dashboard/agenda', appointmentId]);
  }

  /**
   * Export appointment to calendar (ICS)
   */
  exportToCalendar(appointmentId: string): void {
    this.appointmentsApi.exportIcs(appointmentId);
  }

  /**
   * Convert UTC time to local time string
   */
  toLocalTime(utcTime: string): string {
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
   * Get status display text
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
}
