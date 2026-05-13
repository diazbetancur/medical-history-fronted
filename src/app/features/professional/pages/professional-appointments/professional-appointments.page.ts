import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore } from '@core/auth/auth.store';
import { ProfessionalAppointmentsApi } from '@data/api/professional-appointments.api';
import type {
  AppointmentDto,
  AppointmentStatus,
} from '@data/models/appointment.models';
import { ProfessionalAppointmentsStore } from '@data/stores/professional-appointments.store';
import { ToastService } from '@shared/services';

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
    MatMenuModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
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

  protected readonly selectedTabIndex = signal(0);
  protected readonly rangeFrom = signal(this.getDateInputValue(new Date()));
  protected readonly rangeTo = signal(
    this.getDateInputValue(this.addDays(new Date(), 7)),
  );
  protected readonly rangeLoading = signal(false);
  protected readonly hasRangeFilterResult = signal(false);
  protected readonly rangeAppointments = signal<AppointmentDto[]>([]);
  protected readonly monthLoading = signal(false);
  protected readonly monthAppointments = signal<AppointmentDto[]>([]);

  protected readonly appointmentsByDate = () => this.store.appointmentsByDate();
  protected readonly groupedMonthAppointments = computed(() => {
    const grouped: Record<string, AppointmentDto[]> = {};

    for (const appointment of this.monthAppointments()) {
      if (!grouped[appointment.date]) {
        grouped[appointment.date] = [];
      }

      grouped[appointment.date].push(appointment);
    }

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
  protected readonly groupedMonthEntries = computed(() =>
    Object.entries(this.groupedMonthAppointments()).map(
      ([date, appointments]) => ({ date, appointments }),
    ),
  );
  protected readonly groupedRangeAppointments = computed(() => {
    const grouped: Record<string, AppointmentDto[]> = {};

    for (const appointment of this.rangeAppointments()) {
      if (!grouped[appointment.date]) {
        grouped[appointment.date] = [];
      }

      grouped[appointment.date].push(appointment);
    }

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
  protected readonly groupedRangeEntries = computed(() =>
    Object.entries(this.groupedRangeAppointments()).map(
      ([date, appointments]) => ({ date, appointments }),
    ),
  );

  ngOnInit(): void {
    this.store.loadUpcomingAppointments();

    const requestedTab = this.route.snapshot.queryParamMap.get('tab');
    if (requestedTab === 'month') {
      this.selectedTabIndex.set(2);
      this.loadMonthAppointments();
    }
  }

  protected onTabChange(index: number): void {
    this.selectedTabIndex.set(index);

    if (
      index === 2 &&
      this.monthAppointments().length === 0 &&
      !this.monthLoading()
    ) {
      this.loadMonthAppointments();
    }
  }

  protected formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(+year, +month - 1, +day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  protected confirmAppointment(appointmentId: string): void {
    this.store.confirmAppointment(appointmentId);
  }

  protected cancelAppointment(appointmentId: string): void {
    this.store.cancelAppointment(appointmentId);
  }

  protected completeAppointment(appointmentId: string): void {
    this.store.completeAppointment(appointmentId);
  }

  protected markAsNoShow(appointmentId: string): void {
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
        pageSize: 100,
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

  private loadMonthAppointments(): void {
    const professionalId = this.authStore.user()?.professionalProfileId;
    if (!professionalId) {
      this.toast.error('No se encontró perfil profesional');
      return;
    }

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.monthLoading.set(true);

    this.appointmentsApi
      .getAppointments({
        professionalId,
        from: this.getDateInputValue(monthStart),
        to: this.getDateInputValue(monthEnd),
        page: 1,
        pageSize: 200,
      })
      .subscribe({
        next: (response) => {
          this.monthAppointments.set(response.items ?? []);
          this.monthLoading.set(false);
        },
        error: (error: { error?: { title?: string } }) => {
          this.toast.error(
            error?.error?.title || 'Error al cargar citas del mes',
          );
          this.monthLoading.set(false);
        },
      });
  }

  protected getPatientDisplayName(appointment: AppointmentDto): string {
    if (appointment.patientName?.trim()) {
      return appointment.patientName;
    }

    if (appointment.patientId?.trim()) {
      return `Paciente #${appointment.patientId.substring(0, 8)}`;
    }

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
