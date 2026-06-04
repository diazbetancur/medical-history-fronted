import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminApi, getErrorMessage } from '@data/api';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  templateUrl: './admin-dashboard.page.html',
  styleUrl: './admin-dashboard.page.scss',
})
export class AdminDashboardPage implements OnInit, OnDestroy {
  private readonly adminApi = inject(AdminApi);
  private refreshTimer: ReturnType<typeof setInterval> | null = null; // assigned in ngOnInit

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly summary = signal({
    activePatients: 0,
    activeProfessionalsNonAdmin: 0,
    appointmentsRequestedThisMonth: 0,
    pendingProfessionalActivationRequests: 0,
    generatedAtUtc: '',
  });

  readonly activePatients = computed(() => this.summary().activePatients);
  readonly activeProfessionalsNonAdmin = computed(
    () => this.summary().activeProfessionalsNonAdmin,
  );
  readonly appointmentsRequestedThisMonth = computed(
    () => this.summary().appointmentsRequestedThisMonth,
  );
  readonly pendingProfessionalActivationRequests = computed(
    () => this.summary().pendingProfessionalActivationRequests,
  );
  readonly generatedAtText = computed(() => {
    const value = this.summary().generatedAtUtc;
    if (!value) {
      return 'No disponible';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString();
  });

  ngOnInit(): void {
    this.loadSummary();
    this.refreshTimer = setInterval(() => this.loadSummary(), REFRESH_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer !== null) clearInterval(this.refreshTimer);
  }

  loadSummary(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminApi.getDashboardSummary().subscribe({
      next: (response) => {
        this.summary.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          getErrorMessage(err?.error ?? err) ||
            'No se pudo cargar el resumen del dashboard',
        );
        this.loading.set(false);
      },
    });
  }
}
