import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';
import { AuthService } from '@core/auth';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDividerModule,
  ],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
