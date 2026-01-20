import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '@core/auth';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss',
})
export class PublicLayoutComponent {
  readonly authService = inject(AuthService);
}
