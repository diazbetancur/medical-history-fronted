import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore } from '@core/auth/auth.store';
import { ProfessionalAppointmentsApi } from '@data/api/professional-appointments.api';
import type {
  AppointmentDto,
  AppointmentStatus,
} from '@data/models/appointment.models';
import { ProfessionalAppointmentsStore } from '@data/stores/professional-appointments.store';
import {
  PAGE_SIZE_CALENDAR_RANGE,
  ToastService,
} from '@shared/index';
import {
  AddExternalAppointmentDialogComponent,
  type AddExternalAppointmentDialogData,
} from './add-external-appointment-dialog/add-external-appointment-dialog.component';

@Component({
  selector: 'app-professional-appointments-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatDividerModule,
    MatMenuModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatTableModule,
  ],
  templateUrl: './professional-appointments.page.html',
  styleUrl: './professional-appointments.page.scss',
})
export class ProfessionalAppointmentsPage implements OnInit {
  protected readonly store = inject(ProfessionalAppointmentsStore);
  private readonly appointmentsApi = inject(ProfessionalAppointmentsApi);
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  protected readonly selectedTabIndex = signal(0);
  protected readonly rangeFrom = signal(this.getDateInputValue(new Date()));
  protected readonly rangeTo = signal(
    this.getDateInputValue(this.addDays(new Date(), 7)),
  );
  protected readonly rangeLoading = signal(false);
  protected readonly hasRangeFilterResult = signal(false);
  protected readonly rangeAppointments = signal<AppointmentDto[]>([]);

  /**
   * Alias to the store's monthLoading signal — keeps the template unchanged.
   */
  protected readonly monthLoading = this.store.monthLoading;

  /**
   * Alias to the store's sortedMonthAppointments computed — keeps the template unchanged.
   */
  protected readonly sortedMonthAppointments = this.store.sortedMonthAppointments;

  /** Columns shown in every appointment table */
  protected readonly displayedColumns: string[] = [
    'date',
    'time',
    'patient',
    'status',
    'actions',
  ];

  /** "Hoy" — today's appointments sorted by start time (CANCELLED already excluded in store) */
  protected readonly sortedTodayAppointments = computed(() =>
    [...this.store.todayAppointments()].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    ),
  );

  /** "Próximos 7 días" — from today onwards, sorted in the store, CANCELLED excluded */
  protected readonly upcomingAppointments = computed(() =>
    this.store.upcomingAppointments(),
  );

  /** "Por rango" — flat list sorted nearest first */
  protected readonly sortedRangeAppointments = computed(() =>
    [...this.rangeAppointments()].sort((a, b) => {
      const dc = a.date.localeCompare(b.date);
      return dc !== 0 ? dc : a.startTime.localeCompare(b.startTime);
    }),
  );

  ngOnInit(): void {
    this.store.loadUpcomingAppointments();

    const requestedTab = this.route.snapshot.queryParamMap.get('tab');
    if (requestedTab === 'month') {
      this.selectedTabIndex.set(2);
      this.store.loadMonthAppointments();
    }
  }

  /**
   * Opens the dialog for adding an external appointment (phone, WhatsApp, etc.).
   * On success the upcoming list is refreshed so the new appointment appears immediately.
   */
  protected openAddExternalDialog(): void {
    if (!this.authStore.hasPermission('Appointments.Create')) {
      this.toast.error('No tienes permiso para registrar citas externas');
      return;
    }

    const professionalProfileId =
      this.authStore.user()?.professionalProfileId;

    if (!professionalProfileId) {
      this.toast.error('No se encontró el perfil profesional');
      return;
    }

    const ref = this.dialog.open<
      AddExternalAppointmentDialogComponent,
      AddExternalAppointmentDialogData,
      AppointmentDto | null
    >(AddExternalAppointmentDialogComponent, {
      data: { professionalProfileId },
      width: '600px',
      maxWidth: '95vw',
      disableClose: true,
    });

    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.toast.success('Cita externa registrada correctamente');
        this.store.loadUpcomingAppointments();
      }
    });
  }

  protected onTabChange(index: number): void {
    this.selectedTabIndex.set(index);

    // Load month data only on first visit to that tab — subsequent refreshes are
    // handled by _reloadAll() inside the store after each action.
    if (index === 2 && !this.store.monthLoaded() && !this.monthLoading()) {
      this.store.loadMonthAppointments();
    }
  }

  /** Short date for table cells, e.g. "mar., 26 may." */
  protected formatShortDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(+year, +month - 1, +day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  protected getStatusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      CANCELLED: 'Cancelada',
      COMPLETED: 'Completada',
      NO_SHOW: 'No asistió',
    };
    return labels[status];
  }

  // ── Appointment action methods ────────────────────────────────────────────

  protected confirmAppointment(appointmentId: string): void {
    if (!this.authStore.hasPermission('Appointments.Update')) {
      this.toast.error('No tienes permiso para confirmar citas');
      return;
    }
    this.store.confirmAppointment(appointmentId);
  }

  protected cancelAppointment(appointmentId: string): void {
    if (!this.authStore.hasPermission('Appointments.Cancel')) {
      this.toast.error('No tienes permiso para cancelar citas');
      return;
    }
    this.store.cancelAppointment(appointmentId);
  }

  protected completeAppointment(appointmentId: string): void {
    if (!this.authStore.hasPermission('Appointments.Update')) {
      this.toast.error('No tienes permiso para completar citas');
      return;
    }
    this.store.completeAppointment(appointmentId);
  }

  protected markAsNoShow(appointmentId: string): void {
    if (!this.authStore.hasPermission('Appointments.Update')) {
      this.toast.error('No tienes permiso para marcar como no asistido');
      return;
    }
    this.store.markAsNoShow(appointmentId);
  }

  protected canCreateHistoryFromAppointment(
    appointment: AppointmentDto,
  ): boolean {
    return (
      this.isToday(appointment.date) &&
      appointment.status !== 'CANCELLED' &&
      !!appointment.patientId
    );
  }

  protected openClinicalHistoryFromAppointment(
    appointment: AppointmentDto,
  ): void {
    if (!appointment.patientId) {
      this.toast.warning('No encontramos el paciente de esta cita');
      return;
    }

    this.router.navigate(['/professional/patients', appointment.patientId], {
      queryParams: {
        createEncounter: '1',
        appointmentId: appointment.id,
      },
    });
  }

  protected applyDateRangeFilter(): void {
    const from = this.rangeFrom();
    const to = this.rangeTo();

    if (!from || !to) {
      this.toast.warning('Debes seleccionar fecha inicial y final');
      return;
    }

    if (from > to) {
      this.toast.warning('La fecha inicial no puede ser mayor que la final');
      return;
    }

    const professionalId = this.authStore.user()?.professionalProfileId;
    if (!professionalId) {
      this.toast.error('No se encontró perfil profesional');
      return;
    }

    this.rangeLoading.set(true);
    this.hasRangeFilterResult.set(true);
    this.rangeAppointments.set([]);

    this.appointmentsApi
      .getAppointments({
        professionalId,
        from,
        to,
        page: 1,
        pageSize: PAGE_SIZE_CALENDAR_RANGE,
      })
      .subscribe({
        next: (response) => {
          this.rangeAppointments.set(response.items ?? []);
          this.rangeLoading.set(false);
        },
        error: (error: { error?: { title?: string } }) => {
          this.toast.error(
            error?.error?.title || 'Error al cargar citas por rango',
          );
          this.rangeLoading.set(false);
        },
      });
  }

  protected getPatientDisplayName(appointment: AppointmentDto): string {
    if (appointment.patientName?.trim()) return appointment.patientName;
    if (appointment.patientId?.trim())
      return `Paciente #${appointment.patientId.substring(0, 8)}`;
    return 'Paciente';
  }

  private getDateInputValue(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private addDays(date: Date, days: number): Date {
    const value = new Date(date);
    value.setDate(value.getDate() + days);
    return value;
  }

  private isToday(date: string): boolean {
    return date === this.getDateInputValue(new Date());
  }
}
