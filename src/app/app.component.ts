import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaInstallService, PwaUpdateService } from '@core/pwa';
import { AnalyticsService } from '@shared/services';
import { InstallPromptComponent, UpdateBannerComponent } from '@shared/ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, InstallPromptComponent, UpdateBannerComponent],
  template: `
    <app-update-banner />
    <router-outlet />
    <app-install-prompt />
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  private readonly analytics = inject(AnalyticsService);
  private readonly pwaInstall = inject(PwaInstallService);
  private readonly pwaUpdate = inject(PwaUpdateService);

  ngOnInit(): void {
    // Initialize analytics (SSR-safe, only runs in browser)
    this.analytics.initialize();

    // Initialize PWA services (SSR-safe)
    this.pwaInstall.init();
    this.pwaUpdate.init();
  }
}
