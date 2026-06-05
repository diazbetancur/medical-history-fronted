import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { PushApi } from '@data/api/push.api';
import { catchError, firstValueFrom, of } from 'rxjs';

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

/**
 * Manages Web Push notification subscriptions.
 *
 * Flow:
 * 1. requestAndSubscribe() — asks permission, subscribes via SwPush,
 *    sends the subscription to the backend.
 * 2. unsubscribe() — removes from backend and browser.
 *
 * All browser APIs are guarded by isPlatformBrowser() for SSR safety.
 */
@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly swPush = inject(SwPush);
  private readonly pushApi = inject(PushApi);
  private readonly platformId = inject(PLATFORM_ID);

  readonly permissionState = signal<PushPermissionState>('default');
  readonly isSubscribed = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.syncPermissionState();
    }
  }

  /** True if push is supported in this browser. */
  get isSupported(): boolean {
    return isPlatformBrowser(this.platformId) &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      this.swPush.isEnabled;
  }

  /**
   * Requests notification permission and subscribes if granted.
   * Must be called from a user gesture (click handler).
   * Returns true if the subscription was successfully saved to the backend.
   */
  async requestAndSubscribe(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      // 1. Get VAPID public key from backend
      const { publicKey } = await firstValueFrom(this.pushApi.getVapidPublicKey());

      // 2. Request browser permission and generate PushSubscription
      const sub = await this.swPush.requestSubscription({ serverPublicKey: publicKey });

      // 3. Extract keys from the subscription
      const p256dh = this.arrayBufferToBase64Url(sub.getKey('p256dh'));
      const auth = this.arrayBufferToBase64Url(sub.getKey('auth'));

      if (!p256dh || !auth) throw new Error('Claves de subscripción no disponibles');

      // 4. Send subscription to backend
      await firstValueFrom(
        this.pushApi.subscribe({
          endpoint: sub.endpoint,
          p256dh,
          auth,
          deviceHint: this.getDeviceHint(),
        }),
      );

      this.permissionState.set('granted');
      this.isSubscribed.set(true);
      return true;
    } catch (err) {
      const state = this.readPermissionState();
      this.permissionState.set(state);
      if (state === 'denied') return false;
      console.error('[PushNotificationService] Error al suscribirse:', err);
      return false;
    }
  }

  /** Removes the current subscription from the browser and backend. */
  async unsubscribe(): Promise<void> {
    if (!this.isSupported) return;

    try {
      const sub = await firstValueFrom(this.swPush.subscription);
      if (sub) {
        await firstValueFrom(
          this.pushApi.unsubscribe(sub.endpoint).pipe(catchError(() => of(void 0))),
        );
        await this.swPush.unsubscribe();
      }
      this.isSubscribed.set(false);
    } catch (err) {
      console.error('[PushNotificationService] Error al desuscribirse:', err);
    }
  }

  private syncPermissionState(): void {
    const state = this.readPermissionState();
    this.permissionState.set(state);

    if (state === 'granted') {
      firstValueFrom(this.swPush.subscription).then((sub) => {
        this.isSubscribed.set(sub !== null);
      });
    }
  }

  private readPermissionState(): PushPermissionState {
    if (!isPlatformBrowser(this.platformId) || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as PushPermissionState;
  }

  private getDeviceHint(): string {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) return 'Android';
    if (/iphone|ipad/i.test(ua)) return 'iOS';
    if (/win/i.test(ua)) return 'Windows';
    if (/mac/i.test(ua)) return 'macOS';
    return 'Browser';
  }

  private arrayBufferToBase64Url(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}
