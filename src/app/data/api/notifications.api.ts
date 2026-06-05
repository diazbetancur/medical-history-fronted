import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

export interface NotificationDto {
  id: string;
  title: string;
  body: string;
  url: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsPageDto {
  items: NotificationDto[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationsApi {
  private readonly api = inject(ApiClient);

  /** Unread count for the bell badge. */
  getCount(): Observable<{ count: number }> {
    return this.api.get<{ count: number }>('/notifications/count');
  }

  /** Paginated notifications. size=3 for dropdown, size=20 for history page. */
  getPage(page = 1, size = 20): Observable<NotificationsPageDto> {
    return this.api.get<NotificationsPageDto>('/notifications', {
      params: { page, size },
    });
  }

  /** Marks all as read. */
  markAllRead(): Observable<void> {
    return this.api.post<void>('/notifications/read-all', {});
  }
}
