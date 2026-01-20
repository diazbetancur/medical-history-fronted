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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { AdminRequestListItem } from '@data/api';
import { AdminRequestsStore } from '@data/stores';
import { AnalyticsService } from '@shared/services';

@Component({
  selector: 'app-admin-requests',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './requests.page.html',
  styleUrl: './requests.page.scss',
})
export class AdminRequestsPageComponent implements OnInit {
  readonly store = inject(AdminRequestsStore);
  private readonly analytics = inject(AnalyticsService);
  private readonly snackBar = inject(MatSnackBar);
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
      case 3:
        return this.store.rejectedRequests();
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
          this.analytics.trackEvent('admin_view_requests', {
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

  rejectRequest(request: AdminRequestListItem): void {
    this.store
      .rejectRequest(request.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open('Solicitud rechazada', 'OK', {
            duration: 3000,
          });

          // Track analytics
          this.analytics.trackEvent('admin_reject_request', {
            requestId: request.id,
            professionalId: request.profileId,
            previousStatus: request.status,
          });
        },
        error: () => {
          this.snackBar.open('Error al rechazar solicitud', 'OK', {
            duration: 3000,
          });
        },
      });
  }
}
