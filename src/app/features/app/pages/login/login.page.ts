import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  hidePassword = signal(true);

  // Expose auth signals
  readonly loading = this.authService.loading;
  readonly loginError = this.authService.loginError;

  login(): void {
    if (!this.email || !this.password) {
      return;
    }

    this.authService.clearLoginError();

    this.authService.loginAndFetchSession(this.email, this.password).subscribe({
      next: (session) => {
        this.navigateAfterLogin(session);
      },
      error: () => {
        // Error is handled by authService and exposed via loginError signal
      },
    });
  }

  private navigateAfterLogin(session: {
    roles: string[];
    hasProfessionalProfile: boolean;
  }): void {
    // Check for returnUrl in query params first
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];

    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    // Navigate based on role
    const isAdmin =
      session.roles.includes('Admin') || session.roles.includes('SuperAdmin');
    const isProfessional = session.roles.includes('Professional');

    if (isAdmin) {
      this.router.navigate(['/admin']);
    } else if (isProfessional) {
      if (session.hasProfessionalProfile) {
        this.router.navigate(['/dashboard']);
      } else {
        // Professional without profile - redirect to onboarding
        this.router.navigate(['/dashboard/profile']);
      }
    } else {
      // Client or unknown role - go to home
      this.router.navigate(['/']);
    }
  }
}
