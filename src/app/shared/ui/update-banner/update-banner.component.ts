import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PwaUpdateService } from '@core/pwa';

/**
 * PWA Update Banner Component
 * Shows when a new service worker version is available.
 */
@Component({
  selector: 'app-update-banner',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './update-banner.component.html',
  styleUrl: './update-banner.component.scss',
})
export class UpdateBannerComponent {
  readonly pwaUpdate = inject(PwaUpdateService);

  update(): void {
    this.pwaUpdate.activateUpdate();
  }

  dismiss(): void {
    this.pwaUpdate.dismissUpdate();
  }
}
