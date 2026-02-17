import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthStore } from '@core/auth/auth.store';
import type { ProblemDetails } from '@core/models';
import { ProfessionalAppointmentsApi } from '@data/api/professional-appointments.api';
import type {
  AppointmentDto,
  AppointmentFilters,
} from '@data/models/appointment.models';
import { ToastService } from '@shared/services';
import { catchError, finalize, of, tap } from 'rxjs';

/**
 * Professional Appointments Store
 *
 * Signal-based state management para citas del profesional.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfessionalAppointmentsStore {
  private readonly appointmentsApi = inject(ProfessionalAppointmentsApi);
  private readonly toastService = inject(ToastService);
  private readonly authStore = inject(AuthStore);

  // State signals
  private readonly _appointments = signal<AppointmentDto[]>([]);
  private readonly _filters = signal<AppointmentFilters>({
    page: 1,
    pageSize: 50,
  });
  private readonly _total = signal<number>(0);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _lastError = signal<ProblemDetails | null>(null);
  private readonly _selectedAppointment = signal<AppointmentDto | null>(null);

  // Public readonly signals
  readonly appointments = this._appointments.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly total = this._total.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly lastError = this._lastError.asReadonly();
  readonly selectedAppointment = this._selectedAppointment.asReadonly();

  // Computed signals
  readonly hasAppointments = computed(() => this._appointments().length > 0);

  readonly appointmentsByDate = computed(() => {
    const appointments = this._appointments();
    const grouped: Record<string, AppointmentDto[]> = {};

    appointments.forEach((apt) => {
      if (!grouped[apt.date]) {
        grouped[apt.date] = [];
      }
      grouped[apt.date].push(apt);
    });

    // Ordenar por fecha
    return Object.keys(grouped)
      .sort()
      .reduce(
        (acc, date) => {
          acc[date] = grouped[date].sort((a, b) =>
            a.startTime.localeCompare(b.startTime),
          );
          return acc;
        },
        {} as Record<string, AppointmentDto[]>,
      );
  });

  readonly todayAppointments = computed(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return this._appointments().filter((apt) => apt.date === today);
  });

  readonly upcomingAppointments = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this._appointments()
      .filter((apt) => apt.date >= today)
      .sort((a, b) => {
        if (a.date === b.date) {
          return a.startTime.localeCompare(b.startTime);
        }
        return a.date.localeCompare(b.date);
      });
  });

  /**
   * Cargar citas del profesional
   */
  loadAppointments(filters?: Partial<AppointmentFilters>): void {
    const professionalId = this.authStore.user()?.professionalProfileId;
    if (!professionalId) {
      this.toastService.error('No se encontró perfil profesional');
      return;
    }

    this._isLoading.set(true);
    this._lastError.set(null);

    if (filters) {
      this._filters.update((current) => ({ ...current, ...filters }));
    }

    this.appointmentsApi
      .getAppointments({
        ...this._filters(),
        professionalId,
      })
      .pipe(
        tap((response) => {
          this._appointments.set(response.items);
          this._total.set(response.total);
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this._lastError.set(problemDetails);
          this._appointments.set([]);
          this.toastService.error(
            problemDetails.title || 'Error al cargar citas',
          );
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Cargar citas de hoy + próximos 7 días
   */
  loadUpcomingAppointments(): void {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    this.loadAppointments({
      dateFrom: today.toISOString().split('T')[0],
      dateTo: nextWeek.toISOString().split('T')[0],
    });
  }

  /**
   * Confirmar cita
   */
  confirmAppointment(appointmentId: string): void {
    this._isLoading.set(true);

    this.appointmentsApi
      .confirmAppointment(appointmentId)
      .pipe(
        tap((updatedAppointment) => {
          this.updateAppointmentInList(updatedAppointment);
          this.toastService.success('Cita confirmada exitosamente');
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this.toastService.error(
            problemDetails.title || 'Error al confirmar cita',
          );
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Cancelar cita
   */
  cancelAppointment(appointmentId: string, reason?: string): void {
    this._isLoading.set(true);

    this.appointmentsApi
      .cancelAppointment(appointmentId, reason)
      .pipe(
        tap((updatedAppointment) => {
          this.updateAppointmentInList(updatedAppointment);
          this.toastService.success('Cita cancelada exitosamente');
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this.toastService.error(
            problemDetails.title || 'Error al cancelar cita',
          );
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Marcar cita como completada
   */
  completeAppointment(appointmentId: string): void {
    this._isLoading.set(true);

    this.appointmentsApi
      .completeAppointment(appointmentId)
      .pipe(
        tap((updatedAppointment) => {
          this.updateAppointmentInList(updatedAppointment);
          this.toastService.success('Cita marcada como completada');
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this.toastService.error(
            problemDetails.title || 'Error al completar cita',
          );
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Marcar paciente como no asistió
   */
  markAsNoShow(appointmentId: string): void {
    this._isLoading.set(true);

    this.appointmentsApi
      .markAsNoShow(appointmentId)
      .pipe(
        tap((updatedAppointment) => {
          this.updateAppointmentInList(updatedAppointment);
          this.toastService.warning('Paciente marcado como no asistido');
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this.toastService.error(
            problemDetails.title || 'Error al actualizar cita',
          );
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Seleccionar cita para ver detalles
   */
  selectAppointment(appointment: AppointmentDto | null): void {
    this._selectedAppointment.set(appointment);
  }

  /**
   * Actualizar cita en la lista (después de acción)
   */
  private updateAppointmentInList(updatedAppointment: AppointmentDto): void {
    this._appointments.update((appointments) =>
      appointments.map((apt) =>
        apt.id === updatedAppointment.id ? updatedAppointment : apt,
      ),
    );
  }

  /**
   * Limpiar estado
   */
  clearError(): void {
    this._lastError.set(null);
  }
}
