import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ServiceRequest } from '@data/api';
import { ProfessionalRequestsStore } from '@data/stores';
import { AnalyticsService, ToastService } from '@shared/services';

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './requests.page.html',
  styleUrl: './requests.page.scss',
})
export class RequestsPageComponent implements OnInit {
  readonly store = inject(ProfessionalRequestsStore);
  private readonly analytics = inject(AnalyticsService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  private currentTab = signal(0);

  // Filtered requests based on current tab
  filteredRequests = computed(() => {
    const tab = this.currentTab();
    switch (tab) {
      case 0:
        return this.store.pendingRequests();
      case 1:
        return this.store.contactedRequests();
      case 2:
        return this.store.closedRequests();
      default:
        return this.store.requests();
    }
  });

  ngOnInit(): void {
    this.loadRequests();
  }

  private loadRequests(): void {
    this.store
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Track view event
          this.analytics.trackEvent('professional_view_requests', {
            pendingCount: this.store.pendingCount(),
            totalCount: this.store.totalCount(),
          });
        },
        error: () => {
          // Error is handled by store
        },
      });
  }

  refresh(): void {
    this.store
      .load({}, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  onTabChange(index: number): void {
    this.currentTab.set(index);
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Hace unos minutos';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: diffDays > 365 ? 'numeric' : undefined,
    });
  }

  markAsContacted(request: ServiceRequest): void {
    this.store
      .updateStatus(request.id, 'Contacted')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Solicitud marcada como contactada');

          // Track analytics
          this.analytics.trackEvent('professional_update_request_status', {
            requestId: request.id,
            previousStatus: request.status,
            newStatus: 'Contacted',
          });
        },
        error: () => {
          this.toast.error('Error al actualizar estado');
        },
      });
  }

  markAsClosed(request: ServiceRequest): void {
    this.store
      .updateStatus(request.id, 'Completed')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Solicitud cerrada exitosamente');

          // Track analytics
          this.analytics.trackEvent('professional_update_request_status', {
            requestId: request.id,
            previousStatus: request.status,
            newStatus: 'Completed',
          });
        },
        error: () => {
          this.toast.error('Error al cerrar solicitud');
        },
      });
  }
}
