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
import { AuthApi } from '@data/api';

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
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Form mode: 'login' | 'register'
  mode = signal<'login' | 'register'>('login');

  // Login fields
  email = 'admin@yourcompany.com';
  password = 'Admin123!*';
  hidePassword = signal(true);

  // Register fields
  firstName = '';
  lastName = '';
  confirmPassword = '';
  hideConfirmPassword = signal(true);

  // Status signals
  readonly loading = this.authService.loading;
  readonly loginError = this.authService.loginError;
  registerLoading = signal(false);
  registerError = signal<string | null>(null);
  registerSuccess = signal<string | null>(null);

  // Session expired message
  readonly sessionExpiredMessage = signal<string | null>(null);

  constructor() {
    // Check for session expired reason in query params
    const reason = this.route.snapshot.queryParams['reason'];
    if (reason === 'session_expired') {
      this.sessionExpiredMessage.set(
        'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      );
    }
  }

  toggleMode(): void {
    this.mode.update((m) => (m === 'login' ? 'register' : 'login'));
    this.clearErrors();
    this.clearForm();
  }

  private clearErrors(): void {
    this.authService.clearLoginError();
    this.registerError.set(null);
    this.registerSuccess.set(null);
  }

  private clearForm(): void {
    this.email = '';
    this.password = '';
    this.firstName = '';
    this.lastName = '';
    this.confirmPassword = '';
  }

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

  register(): void {
    if (
      !this.email ||
      !this.password ||
      !this.confirmPassword ||
      !this.firstName ||
      !this.lastName
    ) {
      this.registerError.set('Por favor completa todos los campos');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.registerError.set('Las contraseñas no coinciden');
      return;
    }

    if (this.password.length < 6) {
      this.registerError.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.registerLoading.set(true);
    this.registerError.set(null);
    this.registerSuccess.set(null);

    this.authApi
      .register({
        email: this.email,
        password: this.password,
        confirmPassword: this.confirmPassword,
        firstName: this.firstName,
        lastName: this.lastName,
      })
      .subscribe({
        next: () => {
          this.registerLoading.set(false);
          this.registerSuccess.set(
            '¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.',
          );
          // Auto-switch to login after 2 seconds
          setTimeout(() => {
            this.mode.set('login');
            this.registerSuccess.set(null);
            // Keep email for convenience
            this.password = '';
            this.confirmPassword = '';
            this.firstName = '';
            this.lastName = '';
          }, 2000);
        },
        error: (err) => {
          this.registerLoading.set(false);
          this.registerError.set(
            err.error?.message ||
              err.error?.title ||
              'Error al crear la cuenta. Intenta nuevamente.',
          );
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
