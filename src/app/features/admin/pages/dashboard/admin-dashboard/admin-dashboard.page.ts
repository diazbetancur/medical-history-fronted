import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminApi, getErrorMessage } from '@data/api';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [MatCardModule, MatProgressSpinnerModule],
  templateUrl: './admin-dashboard.page.html',
  styleUrl: './admin-dashboard.page.scss',
})
export class AdminDashboardPage implements OnInit {
  private readonly adminApi = inject(AdminApi);

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
