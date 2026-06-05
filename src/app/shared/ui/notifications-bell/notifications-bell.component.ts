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
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { NotificationDto, NotificationsApi } from '@data/api/notifications.api';
import { catchError, of } from 'rxjs';

const POLL_INTERVAL_MS = 60_000;
const DROPDOWN_SIZE = 3;

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
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

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
      .pipe(catchError(() => of({ items: [], total: 0, page: 1, pageSize: DROPDOWN_SIZE })))
      .subscribe((page) => {
        this.preview.set(page.items);
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
    // Mark as read visually without navigating
    this.preview.update((list) =>
      list.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
    );
  }

  goToHistory(event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/notifications']);
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
    this.api
      .getCount()
      .pipe(catchError(() => of({ count: 0 })))
      .subscribe(({ count }) => this.unreadCount.set(count));
  }

  private readonly onVisibilityChange = (): void => {
    if (!document.hidden) this.fetchCount();
  };
}
