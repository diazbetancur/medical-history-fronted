import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '@core/auth';
import { ProblemDetails } from '@core/models';
import { AuthApi } from '@data/api';
import { ToastService } from '@shared/services';

/**
 * Login Page Component
 * Handles user authentication using AuthStore MVP
 */
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPageComponent {
  private readonly authApi = inject(AuthApi);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /**
   * Submit login form
   * 1. Call AuthApi.login() to get token
   * 2. Call AuthStore.setToken() to persist
   * 3. Call AuthStore.loadMe() to fetch user + contexts
   * 4. Redirect to dashboard on success
   */
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials = this.form.getRawValue();

    this.authApi.login(credentials).subscribe({
      next: (response) => {
        // Step 1: Save token
        this.authStore.setToken(response.token, response.expiresAt);

        // Step 2: Load user (calls GET /api/auth/me)
        this.authStore.loadMe().subscribe({
          next: (user) => {
            if (user) {
              this.toast.success(`¡Bienvenido, ${user.name}!`);

              // Redirect based on current context type
              const context = this.authStore.currentContext();
              if (context?.type === 'PROFESSIONAL') {
                this.router.navigate(['/dashboard/professional']);
              } else {
                this.router.navigate(['/dashboard']);
              }
            } else {
              this.errorMessage.set('Error al cargar la sesión');
              this.isLoading.set(false);
            }
          },
          error: (err) => {
            const problem = this.extractProblemDetails(err);
            this.errorMessage.set(problem.title);
            this.isLoading.set(false);
          },
        });
      },
      error: (err) => {
        const problem = this.extractProblemDetails(err);
        this.errorMessage.set(problem.title || 'Credenciales inválidas');
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Extract ProblemDetails from HTTP error
   */
  private extractProblemDetails(error: unknown): ProblemDetails {
    if (
      error &&
      typeof error === 'object' &&
      'error' in error &&
      error.error &&
      typeof error.error === 'object'
    ) {
      const err = error.error as Partial<ProblemDetails>;
      if (err.type && err.title && err.status) {
        return err as ProblemDetails;
      }
    }

    return {
      type: 'about:blank',
      title: 'Error al iniciar sesión',
      status: 500,
    };
  }
}
