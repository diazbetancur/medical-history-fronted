import { Component, inject, OnInit, signal } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationDto, NotificationsApi } from '@data/api/notifications.api';
import { catchError, of } from 'rxjs';

const PAGE_SIZE = 5;

@Component({
  selector: 'app-notifications-modal',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './notifications-modal.component.html',
  styleUrl: './notifications-modal.component.scss',
})
export class NotificationsModalComponent implements OnInit {
  private readonly api = inject(NotificationsApi);

  // Optional refs — one will be null depending on how this was opened
  private readonly dialogRef = inject(MatDialogRef<NotificationsModalComponent>, { optional: true });
  private readonly sheetRef = inject(MatBottomSheetRef<NotificationsModalComponent>, { optional: true });

  // MAT_DIALOG_DATA / MAT_BOTTOM_SHEET_DATA are also optional
  private readonly _dialogData = inject(MAT_DIALOG_DATA, { optional: true });
  private readonly _sheetData = inject(MAT_BOTTOM_SHEET_DATA, { optional: true });

  readonly items = signal<NotificationDto[]>([]);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly hasMore = signal(true);

  private currentPage = 0;

  ngOnInit(): void {
    this.loadMore();
    // Mark all as read silently when the modal opens
    this.api.markAllRead().pipe(catchError(() => of(void 0))).subscribe();
  }

  loadMore(): void {
    if (this.loading() || this.loadingMore()) return;

    const isFirstLoad = this.currentPage === 0;
    isFirstLoad ? this.loading.set(true) : this.loadingMore.set(true);

    this.api
      .getPage(++this.currentPage, PAGE_SIZE)
      .pipe(catchError(() => of(null)))
      .subscribe((response) => {
        if (response) {
          const newItems = Array.isArray(response)
            ? (response as NotificationDto[])
            : response.items ?? [];

          this.items.update((prev) => [...prev, ...newItems]);

          const total = Array.isArray(response) ? newItems.length : (response.total ?? 0);
          this.hasMore.set(this.items().length < total);
        } else {
          this.hasMore.set(false);
        }

        this.loading.set(false);
        this.loadingMore.set(false);
      });
  }

  close(): void {
    this.dialogRef?.close();
    this.sheetRef?.dismiss();
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
}
