import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentsApi, type Appointment } from '@data/api';

/**
 * Confirm Appointment Page
 *
 * Allows users to confirm an appointment using a token.
 * Typical URL: /dashboard/agenda/confirm?id=appt-123&token=abc123
 *
 * Flow:
 * 1. Extract id and token from query params
 * 2. Call API to confirm
 * 3. Show success/error message
 * 4. Redirect to appointment detail on success
 */
@Component({
  selector: 'app-confirm-appointment-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './confirm-appointment.page.html',
  styleUrl: './confirm-appointment.page.scss',
})
export class ConfirmAppointmentPageComponent implements OnInit {
  private readonly appointmentsApi = inject(AppointmentsApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // State
  readonly confirming = signal(true);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);
  readonly appointment = signal<Appointment | null>(null);

  ngOnInit(): void {
    // Get id and token from query params
    const id = this.route.snapshot.queryParamMap.get('id');
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!id || !token) {
      this.error.set('Link de confirmación inválido. Faltan parámetros.');
      this.confirming.set(false);
      return;
    }

    this.confirmAppointment(id, token);
  }

  /**
   * Confirm appointment with token
   */
  confirmAppointment(appointmentId: string, token: string): void {
    this.confirming.set(true);
    this.error.set(null);

    this.appointmentsApi
      .confirmAppointment({
        appointmentId,
        token,
      })
      .subscribe({
        next: (appointment) => {
          this.appointment.set(appointment);
          this.success.set(true);
          this.confirming.set(false);
        },
        error: (problem) => {
          // Error handled by interceptor (toast)
          // But we can show specific message here
          const errorMessages: Record<string, string> = {
            INVALID_TOKEN: 'El token de confirmación es inválido',
            EXPIRED_TOKEN: 'El token de confirmación ha expirado',
            ALREADY_CONFIRMED: 'Esta cita ya fue confirmada previamente',
            APPOINTMENT_NOT_FOUND: 'No se encontró la cita',
          };

          const errorCode = problem?.error?.errorCode || 'UNKNOWN';
          this.error.set(
            errorMessages[errorCode] ||
              'Error al confirmar la cita. Intenta de nuevo.',
          );
          this.confirming.set(false);
        },
      });
  }

  /**
   * View appointment details
   */
  viewDetails(): void {
    const appointment = this.appointment();
    if (appointment) {
      this.router.navigate(['/dashboard/agenda', appointment.id]);
    }
  }

  /**
   * Go to appointments list
   */
  goToList(): void {
    this.router.navigate(['/dashboard/agenda']);
  }

  /**
   * Convert UTC time to local time
   */
  toLocalTime(utcTime: string): string {
    const date = new Date(utcTime);
    return date.toLocaleString('es-ES', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  }
}
