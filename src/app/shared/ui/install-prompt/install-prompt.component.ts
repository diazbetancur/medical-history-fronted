import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PwaInstallService } from '@core/pwa';

/**
 * PWA Install Prompt Component
 * Shows install button for Chrome/Android or iOS guide for Safari.
 * Only renders when shouldShowInstallUI is true.
 */
@Component({
  selector: 'app-install-prompt',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './install-prompt.component.html',
  styleUrl: './install-prompt.component.scss',
})
export class InstallPromptComponent {
  readonly pwaInstall = inject(PwaInstallService);

  async install(): Promise<void> {
    await this.pwaInstall.promptInstall();
  }

  dismiss(): void {
    this.pwaInstall.dismissInstallUI();
  }
}
