import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaInstallService, PwaUpdateService } from '@core/pwa';
import { AnalyticsService } from '@shared/services';
import {
  GlobalLoaderComponent,
  InstallPromptComponent,
  UpdateBannerComponent,
} from '@shared/ui';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    GlobalLoaderComponent,
    InstallPromptComponent,
    UpdateBannerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
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
