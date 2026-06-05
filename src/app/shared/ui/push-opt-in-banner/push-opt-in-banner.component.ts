import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PushNotificationService } from '@core/pwa/push-notification.service';

const DISMISSED_KEY = 'push_opt_in_dismissed';

/**
 * Non-intrusive banner that prompts the user to enable push notifications.
 * Shown once per session if permission hasn't been granted or denied yet.
 *
 * Add to the patient and professional dashboard templates:
 *   <app-push-opt-in-banner />
 */
@Component({
  selector: 'app-push-opt-in-banner',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    @if (visible()) {
      <div class="push-banner">
        <mat-icon class="push-banner__icon">notifications_active</mat-icon>
        <div class="push-banner__text">
          <strong>Recibe alertas de tus citas en tiempo real</strong>
          <span>Activa las notificaciones para no perder ninguna actualización.</span>
        </div>
        <div class="push-banner__actions">
          <button mat-flat-button color="primary" (click)="activate()" [disabled]="loading()">
            {{ loading() ? 'Activando…' : 'Activar notificaciones' }}
          </button>
          <button mat-button (click)="dismiss()">Ahora no</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .push-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: var(--color-primary-light, #eff6ff);
      border-left: 4px solid var(--color-primary, #2563eb);
      border-radius: 4px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .push-banner__icon { color: var(--color-primary, #2563eb); }
    .push-banner__text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.9rem;
    }
    .push-banner__actions { display: flex; gap: 8px; align-items: center; }
  `],
})
export class PushOptInBannerComponent implements OnInit {
  private readonly push = inject(PushNotificationService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly visible = signal(false);
  readonly loading = signal(false);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const dismissed = sessionStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    const permission = this.push.permissionState();
    if (permission === 'default' && this.push.isSupported) {
      this.visible.set(true);
    }
  }

  async activate(): Promise<void> {
    this.loading.set(true);
    const success = await this.push.requestAndSubscribe();
    this.loading.set(false);
    if (success || this.push.permissionState() !== 'default') {
      this.visible.set(false);
    }
  }

  dismiss(): void {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    this.visible.set(false);
  }
}
