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
import { GoogleCalendarApi } from '@data/api/google-calendar.api';
import { ProfessionalAppointmentsApi } from '@data/api/professional-appointments.api';
import type {
  AppointmentDto,
  AppointmentStatus,
} from '@data/models/appointment.models';
import type { CalendarBusyBlock } from '@data/models/google-calendar.models';
import { ProfessionalAppointmentsStore } from '@data/stores/professional-appointments.store';
import {
  PAGE_SIZE_CALENDAR_RANGE,
  ToastService,
} from '@shared/index';
import { catchError, of } from 'rxjs';
import {
  AddExternalAppointmentDialogComponent,
  type AddExternalAppointmentDialogData,
} from './add-external-appointment-dialog/add-external-appointment-dialog.component';
import {
  AppointmentDetailDialogComponent,
  type AppointmentDetailDialogData,
} from './appointment-detail-dialog/appointment-detail-dialog.component';

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
/** Rango máximo permitido para el reporte de citas canceladas. */
const MAX_CANCELLED_REPORT_DAYS = 90;

/** Row discriminated union for merged appointment + Google tables. */
export type AgendaRow =
  | { kind: 'appt'; appt: AppointmentDto }
  | { kind: 'google'; block: CalendarBusyBlock };

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
  private readonly googleCalendarApi = inject(GoogleCalendarApi);
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

  // ── Google Calendar busy blocks (read-only, best-effort) ─────────────────
  /** Busy blocks loaded from external calendar for the upcoming 7-day window. */
  protected readonly busyBlocks = signal<CalendarBusyBlock[]>([]);
  protected readonly busyBlocksLoading = signal(false);

  // ── Citas canceladas (reporte por rango, máx. 90 días) ───────────────────
  protected readonly cancelledFrom = signal(this.firstDayOfMonth());
  protected readonly cancelledTo = signal(this.getDateInputValue(new Date()));
  protected readonly cancelledLoading = signal(false);
  protected readonly cancelledLoaded = signal(false);
  protected readonly cancelledAppointments = signal<AppointmentDto[]>([]);

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

  /** Columnas de la tabla de citas canceladas (reporte) */
  protected readonly cancelledColumns: string[] = [
    'cancelledBy',
    'patient',
    'date',
    'time',
    'cancelledAt',
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

  /** "Citas canceladas" — ordenadas por fecha de cancelación, más reciente primero */
  protected readonly sortedCancelledAppointments = computed(() =>
    [...this.cancelledAppointments()].sort((a, b) =>
      (b.cancelledAt ?? '').localeCompare(a.cancelledAt ?? ''),
    ),
  );

  // ── Merged AgendaRow arrays (appointments + Google blocks, sorted by time) ──

  /** Merged rows for "Hoy" tab: appointments + busy blocks sorted by start. */
  protected readonly todayRows = computed<AgendaRow[]>(() => {
    const appts: AgendaRow[] = this.sortedTodayAppointments().map((a) => ({
      kind: 'appt',
      appt: a,
    }));
    const blocks: AgendaRow[] = this.busyBlocks().map((b) => ({
      kind: 'google',
      block: b,
    }));
    return [...appts, ...blocks].sort((a, b) => {
      const aTime =
        a.kind === 'appt'
          ? `${a.appt.date}T${a.appt.startTime}`
          : a.block.startUtc;
      const bTime =
        b.kind === 'appt'
          ? `${b.appt.date}T${b.appt.startTime}`
          : b.block.startUtc;
      return aTime.localeCompare(bTime);
    });
  });

  /** Merged rows for "Próximos 7 días" tab. */
  protected readonly upcomingRows = computed<AgendaRow[]>(() => {
    const appts: AgendaRow[] = this.upcomingAppointments().map((a) => ({
      kind: 'appt',
      appt: a,
    }));
    const blocks: AgendaRow[] = this.busyBlocks().map((b) => ({
      kind: 'google',
      block: b,
    }));
    return [...appts, ...blocks].sort((a, b) => {
      const aTime =
        a.kind === 'appt'
          ? `${a.appt.date}T${a.appt.startTime}`
          : a.block.startUtc;
      const bTime =
        b.kind === 'appt'
          ? `${b.appt.date}T${b.appt.startTime}`
          : b.block.startUtc;
      return aTime.localeCompare(bTime);
    });
  });

  /** Merged rows for "Este mes" tab. */
  protected readonly monthRows = computed<AgendaRow[]>(() => {
    const appts: AgendaRow[] = this.sortedMonthAppointments().map((a) => ({
      kind: 'appt',
      appt: a,
    }));
    const blocks: AgendaRow[] = this.busyBlocks().map((b) => ({
      kind: 'google',
      block: b,
    }));
    return [...appts, ...blocks].sort((a, b) => {
      const aTime =
        a.kind === 'appt'
          ? `${a.appt.date}T${a.appt.startTime}`
          : a.block.startUtc;
      const bTime =
        b.kind === 'appt'
          ? `${b.appt.date}T${b.appt.startTime}`
          : b.block.startUtc;
      return aTime.localeCompare(bTime);
    });
  });

  /** Merged rows for "Por rango" tab. */
  protected readonly rangeRows = computed<AgendaRow[]>(() => {
    const appts: AgendaRow[] = this.sortedRangeAppointments().map((a) => ({
      kind: 'appt',
      appt: a,
    }));
    const blocks: AgendaRow[] = this.busyBlocks().map((b) => ({
      kind: 'google',
      block: b,
    }));
    return [...appts, ...blocks].sort((a, b) => {
      const aTime =
        a.kind === 'appt'
          ? `${a.appt.date}T${a.appt.startTime}`
          : a.block.startUtc;
      const bTime =
        b.kind === 'appt'
          ? `${b.appt.date}T${b.appt.startTime}`
          : b.block.startUtc;
      return aTime.localeCompare(bTime);
    });
  });

  ngOnInit(): void {
    this.store.loadUpcomingAppointments();
    // Tab 0 is "Hoy" — load blocks for today's range on init.
    this.loadBusyBlocksForTab(0);

    const requestedTab = this.route.snapshot.queryParamMap.get('tab');
    if (requestedTab === 'month') {
      this.selectedTabIndex.set(2);
      this.store.loadMonthAppointments();
      this.loadBusyBlocksForTab(2);
    }
  }

  /**
   * Returns {fromIso, toIso} for a given tab index.
   * Tab 4 (Citas canceladas) returns null — no Google blocks.
   */
  private busyRangeForTab(
    index: number,
  ): { fromIso: string; toIso: string } | null {
    const today = new Date();
    switch (index) {
      case 0: {
        // Hoy: start of today → end of today
        const from = new Date(today);
        from.setHours(0, 0, 0, 0);
        const to = new Date(today);
        to.setHours(23, 59, 59, 999);
        return { fromIso: from.toISOString(), toIso: to.toISOString() };
      }
      case 1: {
        // Próximos 7 días: today → +7
        return {
          fromIso: today.toISOString(),
          toIso: this.addDays(today, 7).toISOString(),
        };
      }
      case 2: {
        // Este mes: first day → last day
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        last.setHours(23, 59, 59, 999);
        return { fromIso: first.toISOString(), toIso: last.toISOString() };
      }
      case 3: {
        // Por rango: use rangeFrom/rangeTo signals (date strings yyyy-MM-dd)
        const from = this.rangeFrom();
        const to = this.rangeTo();
        if (!from || !to) return null;
        return {
          fromIso: new Date(`${from}T00:00:00`).toISOString(),
          toIso: new Date(`${to}T23:59:59`).toISOString(),
        };
      }
      default:
        return null; // Tab 4: Citas canceladas — no blocks
    }
  }

  /** Load Google Calendar busy blocks for the given tab's range. Best-effort. */
  private loadBusyBlocksForTab(index: number): void {
    const range = this.busyRangeForTab(index);
    if (!range) {
      this.busyBlocks.set([]);
      this.busyBlocksLoading.set(false);
      return;
    }
    this.busyBlocksLoading.set(true);
    this.googleCalendarApi
      .getBusyBlocks(range.fromIso, range.toIso)
      .pipe(catchError(() => of([])))
      .subscribe((blocks) => {
        this.busyBlocks.set(blocks);
        this.busyBlocksLoading.set(false);
      });
  }

  /** Format an ISO UTC date string for display (local time). */
  protected formatBusyBlockTime(isoUtc: string): string {
    const d = new Date(isoUtc);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  /** Format just the date portion of an ISO UTC string (local date). */
  protected formatBusyBlockDate(isoUtc: string): string {
    const d = new Date(isoUtc);
    return d.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
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
      width: '720px',
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

    // Tab "Citas canceladas": cargar el mes actual en la primera visita.
    if (index === 4 && !this.cancelledLoaded() && !this.cancelledLoading()) {
      this.loadCancelled(this.cancelledFrom(), this.cancelledTo());
    }

    // Reload Google busy blocks for the active tab's range.
    this.loadBusyBlocksForTab(index);
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
      RESCHEDULED: 'Reprogramada',
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

  protected canMarkAttendance(appointment: AppointmentDto): boolean {
    return (
      appointment.status === 'CONFIRMED' ||
      appointment.status === 'RESCHEDULED'
    );
  }

  protected canCreateHistoryFromAppointment(
    appointment: AppointmentDto,
  ): boolean {
    return (
      this.isToday(appointment.date) &&
      appointment.status !== 'CANCELLED' &&
      !this.isExternalAppointment(appointment) &&
      this.hasPlatformPatient(appointment)
    );
  }

  protected openAppointmentDetail(appointment: AppointmentDto): void {
    const professionalProfileId =
      this.authStore.user()?.professionalProfileId || appointment.professionalId;

    if (!professionalProfileId) {
      this.toast.error('No se encontrÃ³ el perfil profesional');
      return;
    }

    this.dialog.open<
      AppointmentDetailDialogComponent,
      AppointmentDetailDialogData
    >(AppointmentDetailDialogComponent, {
      data: {
        appointmentId: appointment.id,
        professionalProfileId,
        initialAppointment: appointment,
      },
      width: '820px',
      maxWidth: '95vw',
      panelClass: 'appointment-detail-dialog-panel',
    });
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

  protected hasMenuActionsAfterDetail(appointment: AppointmentDto): boolean {
    return (
      appointment.status === 'PENDING' ||
      appointment.status === 'CONFIRMED' ||
      appointment.status === 'RESCHEDULED' ||
      this.canCreateHistoryFromAppointment(appointment) ||
      (appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED')
    );
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
          // Reload Google blocks for the new range.
          this.loadBusyBlocksForTab(3);
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

  protected isExternalAppointment(appointment: AppointmentDto): boolean {
    return appointment.type === 'EXTERNAL';
  }

  // ── Citas canceladas ──────────────────────────────────────────────────────

  protected getCancelledByLabel(cancelledBy: string | undefined): string {
    const labels: Record<string, string> = {
      Professional: 'Profesional',
      Patient: 'Paciente',
      System: 'Sistema',
      CalendarSync: 'Calendario externo',
    };
    return cancelledBy ? (labels[cancelledBy] ?? cancelledBy) : '—';
  }

  protected formatCancelledAt(iso: string | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  protected applyCancelledFilter(): void {
    const from = this.cancelledFrom();
    const to = this.cancelledTo();

    if (!from || !to) {
      this.toast.warning('Debes seleccionar fecha inicial y final');
      return;
    }
    if (from > to) {
      this.toast.warning('La fecha inicial no puede ser mayor que la final');
      return;
    }
    if (this.daysBetween(from, to) > MAX_CANCELLED_REPORT_DAYS) {
      this.toast.warning('El rango máximo del reporte es de 90 días');
      return;
    }

    this.loadCancelled(from, to);
  }

  private loadCancelled(from: string, to: string): void {
    const professionalId = this.authStore.user()?.professionalProfileId;
    if (!professionalId) {
      this.toast.error('No se encontró perfil profesional');
      return;
    }

    this.cancelledLoading.set(true);
    this.cancelledLoaded.set(true);
    this.cancelledAppointments.set([]);

    this.appointmentsApi
      .getAppointments({
        professionalId,
        status: 'CANCELLED',
        from,
        to,
        page: 1,
        pageSize: PAGE_SIZE_CALENDAR_RANGE,
      })
      .subscribe({
        next: (response) => {
          this.cancelledAppointments.set(response.items ?? []);
          this.cancelledLoading.set(false);
        },
        error: (error: { error?: { title?: string } }) => {
          this.toast.error(
            error?.error?.title || 'Error al cargar citas canceladas',
          );
          this.cancelledLoading.set(false);
        },
      });
  }

  private firstDayOfMonth(): string {
    const now = new Date();
    return this.getDateInputValue(
      new Date(now.getFullYear(), now.getMonth(), 1),
    );
  }

  private daysBetween(from: string, to: string): number {
    const f = new Date(`${from}T00:00:00`).getTime();
    const t = new Date(`${to}T00:00:00`).getTime();
    return Math.round((t - f) / 86_400_000);
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

  private hasPlatformPatient(appointment: AppointmentDto): boolean {
    return (
      !!appointment.patientId?.trim() &&
      appointment.patientId !== EMPTY_GUID
    );
  }
}
