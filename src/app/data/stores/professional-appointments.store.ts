import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthStore } from '@core/auth/auth.store';
import type { ProblemDetails } from '@core/models';
import { ProfessionalAppointmentsApi } from '@data/api/professional-appointments.api';
import type {
  AppointmentDto,
  AppointmentFilters,
  AppointmentStatus,
} from '@data/models/appointment.models';
import {
  MSG_APPOINTMENT_CANCELLED,
  MSG_APPOINTMENT_COMPLETED,
  MSG_APPOINTMENT_CONFIRMED,
  MSG_APPOINTMENT_ERROR_CANCEL,
  MSG_APPOINTMENT_ERROR_COMPLETE,
  MSG_APPOINTMENT_ERROR_CONFIRM,
  MSG_APPOINTMENT_ERROR_LOAD_LIST,
  MSG_APPOINTMENT_ERROR_NO_SHOW,
  MSG_APPOINTMENT_NO_SHOW,
  MSG_APPOINTMENT_PROFILE_NOT_FOUND,
} from '@shared/constants/messages.constants';
import { PAGE_SIZE_MONTH } from '@shared/constants/pagination.constants';
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

  // Month tab state
  private readonly _monthAppointments = signal<AppointmentDto[]>([]);
  private readonly _monthLoading = signal<boolean>(false);
  /** Tracks whether the month tab has been loaded at least once (to decide if _reloadAll should refresh it). */
  private readonly _monthLoaded = signal<boolean>(false);

  // Public readonly signals
  readonly appointments = this._appointments.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly total = this._total.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly lastError = this._lastError.asReadonly();
  readonly selectedAppointment = this._selectedAppointment.asReadonly();
  readonly monthLoading = this._monthLoading.asReadonly();
  readonly monthLoaded = this._monthLoaded.asReadonly();

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

  /** Hoy — filtramos CANCELLED para que no ensucien la vista de hoy */
  readonly todayAppointments = computed(() => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return this._appointments().filter(
      (apt) => apt.date === today && apt.status !== 'CANCELLED',
    );
  });

  /** Próximos — desde hoy en adelante, sin CANCELLED, ordenados */
  readonly upcomingAppointments = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this._appointments()
      .filter((apt) => apt.date >= today && apt.status !== 'CANCELLED')
      .sort((a, b) => {
        if (a.date === b.date) {
          return a.startTime.localeCompare(b.startTime);
        }
        return a.date.localeCompare(b.date);
      });
  });

  /** Este mes — sin CANCELLED, ordenado por fecha y hora */
  readonly sortedMonthAppointments = computed(() =>
    [...this._monthAppointments()]
      .filter((apt) => apt.status !== 'CANCELLED')
      .sort((a, b) => {
        const dc = a.date.localeCompare(b.date);
        return dc !== 0 ? dc : a.startTime.localeCompare(b.startTime);
      }),
  );

  /**
   * Cargar citas del profesional
   */
  loadAppointments(filters?: Partial<AppointmentFilters>): void {
    const professionalId = this.authStore.user()?.professionalProfileId;
    if (!professionalId) {
      this.toastService.error(MSG_APPOINTMENT_PROFILE_NOT_FOUND);
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
            problemDetails.title || MSG_APPOINTMENT_ERROR_LOAD_LIST,
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
      from: today.toISOString().split('T')[0],
      to: nextWeek.toISOString().split('T')[0],
    });
  }

  /**
   * Cargar citas del mes actual
   */
  loadMonthAppointments(): void {
    const professionalId = this.authStore.user()?.professionalProfileId;
    if (!professionalId) {
      this.toastService.error(MSG_APPOINTMENT_PROFILE_NOT_FOUND);
      return;
    }

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this._monthLoading.set(true);
    this._monthLoaded.set(true);

    this.appointmentsApi
      .getAppointments({
        professionalId,
        from: this.toDateString(monthStart),
        to: this.toDateString(monthEnd),
        page: 1,
        pageSize: PAGE_SIZE_MONTH,
      })
      .pipe(
        tap((response) => {
          this._monthAppointments.set(response.items ?? []);
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this.toastService.error(
            problemDetails.title || MSG_APPOINTMENT_ERROR_LOAD_LIST,
          );
          return of(null);
        }),
        finalize(() => this._monthLoading.set(false)),
      )
      .subscribe();
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
          this.toastService.success(MSG_APPOINTMENT_CONFIRMED);
          this._reloadAll();
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this.toastService.error(
            problemDetails.title || MSG_APPOINTMENT_ERROR_CONFIRM,
          );
          return of(null);
        }),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe();
  }

  /**
   * Cancelar cita.
   * El endpoint devuelve 204 No Content (sin cuerpo), por lo que actualizamos
   * el estado del appointment en memoria usando el appointmentId conocido.
   */
  cancelAppointment(appointmentId: string, reason?: string): void {
    this._isLoading.set(true);

    this.appointmentsApi
      .cancelAppointment(appointmentId, reason)
      .pipe(
        tap(() => {
          this._appointments.update((list) =>
            list.map((apt) =>
              apt.id === appointmentId
                ? ({
                    ...apt,
                    status: 'CANCELLED' as AppointmentStatus,
                    cancellationReason: reason,
                  } satisfies AppointmentDto)
                : apt,
            ),
          );
          this.toastService.success(MSG_APPOINTMENT_CANCELLED);
          this._reloadAll();
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this.toastService.error(
            problemDetails.title || MSG_APPOINTMENT_ERROR_CANCEL,
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
          this.toastService.success(MSG_APPOINTMENT_COMPLETED);
          this._reloadAll();
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this.toastService.error(
            problemDetails.title || MSG_APPOINTMENT_ERROR_COMPLETE,
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
          this.toastService.warning(MSG_APPOINTMENT_NO_SHOW);
          this._reloadAll();
        }),
        catchError((error) => {
          const problemDetails = error.error as ProblemDetails;
          this.toastService.error(
            problemDetails.title || MSG_APPOINTMENT_ERROR_NO_SHOW,
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
   * Recarga de todas las vistas tras una acción (confirm/cancel/complete/no-show).
   * Usa queueMicrotask para ejecutarse DESPUÉS de que RxJS finalize() baje _isLoading,
   * evitando un parpadeo donde isLoading=true y las listas ya están vacías.
   */
  private _reloadAll(): void {
    queueMicrotask(() => {
      this.loadUpcomingAppointments();
      if (this._monthLoaded()) {
        this.loadMonthAppointments();
      }
    });
  }

  /** Convierte un Date a string YYYY-MM-DD */
  private toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Limpiar estado
   */
  clearError(): void {
    this._lastError.set(null);
  }
}
