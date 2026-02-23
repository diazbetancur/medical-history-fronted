import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

/**
 * Offline Page Component
 * Displayed when the app is offline and the requested page is not cached.
 */
@Component({
  selector: 'app-offline-page',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './offline.page.html',
  styleUrl: './offline.page.scss',
})
export class OfflinePageComponent {
  retry(): void {
    window.location.reload();
  }
}
