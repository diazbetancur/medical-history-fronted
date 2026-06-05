import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

export interface PushSubscribeRequest {
  endpoint: string;
  p256dh: string;
  auth: string;
  deviceHint?: string;
}

@Injectable({ providedIn: 'root' })
export class PushApi {
  private readonly api = inject(ApiClient);

  /** Returns the VAPID public key needed to subscribe. No auth required. */
  getVapidPublicKey(): Observable<{ publicKey: string }> {
    return this.api.get<{ publicKey: string }>('/push/vapid-public-key');
  }

  /** Saves or updates a push subscription for the authenticated user. */
  subscribe(request: PushSubscribeRequest): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('/push/subscribe', request);
  }

  /** Removes a push subscription (logout or user preference). */
  unsubscribe(endpoint: string): Observable<void> {
    return this.api.post<void>('/push/unsubscribe', { endpoint });
  }
}
