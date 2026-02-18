import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth';
import { ProfessionalApi } from '@data/api';
import type {
  ProfessionalDashboardAppointment,
  ProfessionalDashboardResponse,
} from '@data/api/api-models';
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
    MatTooltipModule,
  ],
  templateUrl: './professional-dashboard.page.html',
  styleUrl: './professional-dashboard.page.scss',
})
export class ProfessionalDashboardPage {
  private readonly professionalApi = inject(ProfessionalApi);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
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
      .subscribe(() => {
        const profileId = this.authService.professionalProfileId();
        if (!profileId) {
          this.error.set(
            'No se encontró un perfil profesional asociado a tu cuenta.',
          );
          this.loading.set(false);
          return;
        }
        this.loadDashboard(profileId);
      });
  }

  reload(): void {
    const profileId = this.authService.professionalProfileId();
    if (!profileId) return;
    this.error.set(null);
    this.dashboard.set(null);
    this.loadDashboard(profileId);
  }

  private loadDashboard(profileId: string): void {
    this.loading.set(true);
    this.professionalApi.getDashboard(profileId).subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los datos del dashboard.');
        this.loading.set(false);
      },
    });
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
