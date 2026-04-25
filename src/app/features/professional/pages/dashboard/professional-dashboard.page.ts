import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { AuthService, AuthStore } from '@core/auth';
import { ProfessionalApi } from '@data/api';
import type {
  ProfessionalDashboardAppointment,
  ProfessionalDashboardResponse,
  ProfessionalDashboardSummaryResponse,
} from '@data/api/api-models';
import { ToastService } from '@shared/services/toast.service';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-professional-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './professional-dashboard.page.html',
  styleUrl: './professional-dashboard.page.scss',
})
export class ProfessionalDashboardPage {
  private readonly professionalApi = inject(ProfessionalApi);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);

  readonly userName = computed(() => this.authStore.userName() || '');
  readonly loading = signal(true);
  readonly dashboard = signal<ProfessionalDashboardResponse | null>(null);

  readonly appointmentColumns = [
    'time',
    'patient',
    'duration',
    'reason',
    'status',
  ];

  constructor() {
    // Wait for the auth session to finish initializing before reading professionalProfileId.
    // This prevents a race condition where ngOnInit runs before /me has resolved.
    toObservable(this.authService.loading)
      .pipe(
        filter((isLoading) => !isLoading),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.loadDashboard());
  }

  private loadDashboard(): void {
    this.loading.set(true);
    this.professionalApi.getDashboardSummary().subscribe({
      next: (data: ProfessionalDashboardSummaryResponse) => {
        this.dashboard.set(this.mapSummaryToDashboard(data));
        this.loading.set(false);
      },
      error: () => {
        this.toast.error(
          'Se presentó una falla consultando datos del dashboard.',
        );
        this.loading.set(false);
      },
    });
  }

  private mapSummaryToDashboard(
    summary: ProfessionalDashboardSummaryResponse,
  ): ProfessionalDashboardResponse {
    return {
      appointmentsTodayCount: summary.todayAppointments,
      appointmentsToday: [],
      activePatientsCount: summary.activePatientsLast6Months,
      pendingEncountersCount: summary.pendingAppointmentsThisMonth,
      monthlyRevenue: summary.approxMonthlyIncome,
      completedAppointmentsThisMonth: 0,
      revenueMonth: '',
    };
  }

  getAppointmentStatusChip(status: string): {
    label: string;
    icon: string;
    css: string;
  } {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return {
          label: 'Confirmada',
          icon: 'check_circle',
          css: 'status-confirmed',
        };
      case 'pending':
        return { label: 'Pendiente', icon: 'schedule', css: 'status-pending' };
      case 'completed':
        return {
          label: 'Completada',
          icon: 'done_all',
          css: 'status-completed',
        };
      case 'cancelled':
        return { label: 'Cancelada', icon: 'cancel', css: 'status-cancelled' };
      case 'noshow':
      case 'no_show':
        return {
          label: 'No se presentó',
          icon: 'person_off',
          css: 'status-noshow',
        };
      default:
        return { label: status ?? '?', icon: 'help', css: '' };
    }
  }

  trackById(_: number, item: ProfessionalDashboardAppointment): string {
    return item.id;
  }
}
