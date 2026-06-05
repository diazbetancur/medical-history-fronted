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

@Injectable({ providedIn: 'root' })
export class NotificationsApi {
  private readonly api = inject(ApiClient);

  /** Unread count for the bell badge. */
  getCount(): Observable<{ count: number }> {
    return this.api.get<{ count: number }>('/notifications/count');
  }

  /** Most recent 20 notifications. */
  getList(): Observable<NotificationDto[]> {
    return this.api.get<NotificationDto[]>('/notifications');
  }

  /** Marks all as read. Call when the user opens the dropdown. */
  markAllRead(): Observable<void> {
    return this.api.post<void>('/notifications/read-all', {});
  }
}
