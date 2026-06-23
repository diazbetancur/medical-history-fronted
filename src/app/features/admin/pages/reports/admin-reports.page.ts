import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminReportsApi, AdminReportsOverviewDto } from '@data/api/admin-reports.api';
import { AuthStore } from '@core/auth/auth.store';

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './admin-reports.page.html',
  styleUrl: './admin-reports.page.scss',
})
export class AdminReportsPage implements OnInit {
  private readonly api = inject(AdminReportsApi);
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly overview = signal<AdminReportsOverviewDto | null>(null);

  readonly fromDate = signal(toDateString(new Date(Date.now() - 29 * 86400000)));
  readonly toDate = signal(toDateString(new Date()));

  readonly channelLabel = computed(() => {
    const ch = this.overview()?.channel;
    return ch === 'TODOS' ? 'Todos los canales' : (ch ?? '—');
  });

  readonly isSuperAdmin = computed(() =>
    this.authStore.userRoles().some((r) => r.toUpperCase() === 'SUPERADMIN'),
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getOverview(this.fromDate(), this.toDate()).subscribe({
      next: (data) => {
        this.overview.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar los reportes. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  export(format: 'csv' | 'xlsx'): void {
    const url = this.api.getExportUrl(this.fromDate(), this.toDate(), format);
    const token = this.authStore.token();
    this.http
      .get(url, { responseType: 'blob', headers: { Authorization: `Bearer ${token}` } })
      .subscribe({
        next: (blob) => {
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `licencias_${this.fromDate()}_${this.toDate()}.${format}`;
          link.click();
          URL.revokeObjectURL(link.href);
        },
        error: () => this.error.set(`Error al descargar el ${format.toUpperCase()}.`),
      });
  }
}
