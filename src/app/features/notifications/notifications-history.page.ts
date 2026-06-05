import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { NotificationDto, NotificationsApi, NotificationsPageDto } from '@data/api/notifications.api';
import { catchError, of } from 'rxjs';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-notifications-history',
  standalone: true,
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './notifications-history.page.html',
  styleUrl: './notifications-history.page.scss',
})
export class NotificationsHistoryPage implements OnInit {
  private readonly api = inject(NotificationsApi);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly page = signal<NotificationsPageDto>({
    items: [],
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
  });

  readonly pageSize = PAGE_SIZE;

  ngOnInit(): void {
    this.loadPage(1);
    this.api.markAllRead().pipe(catchError(() => of(void 0))).subscribe();
  }

  onPageChange(event: PageEvent): void {
    this.loadPage(event.pageIndex + 1);
  }

  goBack(): void {
    void this.router.navigate(['/patient']);
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('es-HN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private loadPage(pageNum: number): void {
    this.loading.set(true);
    this.api
      .getPage(pageNum, PAGE_SIZE)
      .pipe(catchError(() => of({ items: [], total: 0, page: pageNum, pageSize: PAGE_SIZE })))
      .subscribe((result) => {
        this.page.set(result);
        this.loading.set(false);
      });
  }
}
