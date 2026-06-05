import { DatePipe, isPlatformBrowser } from '@angular/common';
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

const POLL_INTERVAL_MS = 30_000;

@Component({
  selector: 'app-notifications-bell',
  standalone: true,
  imports: [
    DatePipe,
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
  readonly notifications = signal<NotificationDto[]>([]);
  readonly loadingList = signal(false);

  ngOnInit(): void {
    this.fetchCount();
    if (isPlatformBrowser(this.platformId)) {
      this.pollTimer = setInterval(() => this.fetchCount(), POLL_INTERVAL_MS);

      // Refresh immediately when the user switches back to this tab
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  ngOnDestroy(): void {
    if (this.pollTimer !== null) clearInterval(this.pollTimer);
    if (isPlatformBrowser(this.platformId)) {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
  }

  private readonly onVisibilityChange = (): void => {
    if (!document.hidden) this.fetchCount();
  };

  onBellClick(): void {
    this.loadingList.set(true);
    this.api
      .getList()
      .pipe(catchError(() => of([])))
      .subscribe((list) => {
        this.notifications.set(list);
        this.loadingList.set(false);
      });

    // Mark as read after a short delay so the user sees the badge change
    if (this.unreadCount() > 0) {
      setTimeout(() => {
        this.api
          .markAllRead()
          .pipe(catchError(() => of(void 0)))
          .subscribe(() => this.unreadCount.set(0));
      }, 800);
    }
  }

  navigate(notification: NotificationDto): void {
    if (notification.url) {
      void this.router.navigateByUrl(notification.url);
    }
  }

  formatDate(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffH = Math.floor(diffMin / 60);
    const diffD = Math.floor(diffH / 24);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffH < 24) return `Hace ${diffH}h`;
    if (diffD === 1) return 'Ayer';
    return date.toLocaleDateString('es-HN', { day: 'numeric', month: 'short' });
  }

  private fetchCount(): void {
    this.api
      .getCount()
      .pipe(catchError(() => of({ count: 0 })))
      .subscribe(({ count }) => this.unreadCount.set(count));
  }
}
