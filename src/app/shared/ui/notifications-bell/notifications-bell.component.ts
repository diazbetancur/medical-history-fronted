import { BreakpointObserver } from '@angular/cdk/layout';
import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationDto, NotificationsApi, NotificationsPageDto } from '@data/api/notifications.api';
import { NotificationsModalComponent } from '@shared/ui/notifications-modal/notifications-modal.component';
import { catchError, of } from 'rxjs';

const POLL_INTERVAL_MS = 90_000;
// No re-consultar el conteo si el último fetch fue hace menos de esto (evita
// ráfagas al alternar pestañas — TD-01).
const MIN_REFETCH_GAP_MS = 30_000;
const DROPDOWN_SIZE = 3;
const MOBILE_BREAKPOINT = '(max-width: 768px)';

@Component({
  selector: 'app-notifications-bell',
  standalone: true,
  imports: [
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './notifications-bell.component.html',
  styleUrl: './notifications-bell.component.scss',
})
export class NotificationsBellComponent implements OnInit, OnDestroy {
  private readonly api = inject(NotificationsApi);
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly platformId = inject(PLATFORM_ID);
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastFetchAt = 0;

  readonly unreadCount = signal(0);
  readonly preview = signal<NotificationDto[]>([]);
  readonly loadingPreview = signal(false);

  ngOnInit(): void {
    this.fetchCount();
    if (isPlatformBrowser(this.platformId)) {
      this.pollTimer = setInterval(() => this.fetchCount(), POLL_INTERVAL_MS);
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  ngOnDestroy(): void {
    if (this.pollTimer !== null) clearInterval(this.pollTimer);
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  onBellOpen(): void {
    this.loadingPreview.set(true);
    this.api
      .getPage(1, DROPDOWN_SIZE)
      .pipe(catchError(() => of(null)))
      .subscribe((response) => {
        this.preview.set(this.extractItems(response));
        this.loadingPreview.set(false);
      });

    if (this.unreadCount() > 0) {
      this.api
        .markAllRead()
        .pipe(catchError(() => of(void 0)))
        .subscribe(() => this.unreadCount.set(0));
    }
  }

  markRead(notification: NotificationDto, event: Event): void {
    event.stopPropagation();
    this.preview.update((list) =>
      list.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
    );
  }

  openHistory(event: Event): void {
    event.stopPropagation();
    const isMobile = this.breakpoints.isMatched(MOBILE_BREAKPOINT);

    if (isMobile) {
      this.bottomSheet.open(NotificationsModalComponent, {
        panelClass: 'notif-bottom-sheet',
      });
    } else {
      this.dialog.open(NotificationsModalComponent, {
        width: '460px',
        maxHeight: '80vh',
        panelClass: 'notif-dialog',
        autoFocus: false,
      });
    }

    // Reset badge once user opens history
    this.unreadCount.set(0);
  }

  formatDate(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffH < 24) return `Hace ${diffH}h`;
    if (diffD === 1) return 'Ayer';
    return new Date(iso).toLocaleDateString('es-HN', { day: 'numeric', month: 'short' });
  }

  private fetchCount(): void {
    this.lastFetchAt = Date.now();
    this.api
      .getCount()
      .pipe(catchError(() => of({ count: 0 })))
      .subscribe(({ count }) => this.unreadCount.set(count));
  }

  private readonly onVisibilityChange = (): void => {
    // Al volver el foco, refrescar solo si pasó el gap mínimo (debounce TD-01).
    if (!document.hidden && Date.now() - this.lastFetchAt >= MIN_REFETCH_GAP_MS) {
      this.fetchCount();
    }
  };

  private extractItems(response: NotificationsPageDto | NotificationDto[] | null): NotificationDto[] {
    if (!response) return [];
    if (Array.isArray(response)) return response.slice(0, DROPDOWN_SIZE);
    return response.items ?? [];
  }
}
