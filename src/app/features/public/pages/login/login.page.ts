import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthStore, PostLoginNavigationService } from '@core/auth';
import { CurrentUserDto, ProblemDetails } from '@core/models';
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
    MatCheckboxModule,
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
  private readonly postLoginNavigation = inject(PostLoginNavigationService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    asProfessional: [false],
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

    this.authApi
      .login({
        email: credentials.email,
        password: credentials.password,
      })
      .subscribe({
        next: (response) => {
          // Step 1: Save token
          this.authStore.setToken(response.token, response.expiresAt);

          // Step 2: Load user (calls GET /api/auth/me)
          this.authStore.loadMe().subscribe({
            next: (user) => {
              if (user) {
                this.handlePostLogin(user, credentials.asProfessional);
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

  constructor() {
    const query = this.route.snapshot.queryParamMap;
    const email = query.get('email');
    const asProfessional = query.get('professional') === '1';

    if (email) {
      this.form.controls.email.setValue(email);
    }
    if (asProfessional) {
      this.form.controls.asProfessional.setValue(true);
    }
  }

  private handlePostLogin(user: CurrentUserDto, asProfessional: boolean): void {
    if (!asProfessional) {
      const displayName = user.name || user.email || 'usuario';
      this.toast.success(`¡Bienvenido, ${displayName}!`);
      this.isLoading.set(false);
      this.postLoginNavigation.navigateByContext();
      return;
    }

    const hasProfessionalContext = user.contexts.some(
      (ctx) => ctx.type === 'PROFESSIONAL',
    );

    if (hasProfessionalContext) {
      this.switchAndNavigateProfessional(user);
      return;
    }

    this.authApi
      .becomeProfessional({ reason: 'Activación desde login en frontend' })
      .subscribe({
        next: (result) => {
          if (!result.success) {
            this.errorMessage.set(
              result.message ||
                'No fue posible activar el perfil profesional en este momento.',
            );
            this.isLoading.set(false);
            return;
          }

          this.authStore.loadMe().subscribe({
            next: (updatedUser) => {
              if (!updatedUser) {
                this.errorMessage.set('No se pudo actualizar la sesión');
                this.isLoading.set(false);
                return;
              }

              this.toast.success(
                result.message || 'Perfil profesional activado correctamente',
              );
              this.switchAndNavigateProfessional(updatedUser);
            },
            error: (err) => {
              const problem = this.extractProblemDetails(err);
              this.errorMessage.set(
                problem.title || 'No se pudo actualizar la sesión',
              );
              this.isLoading.set(false);
            },
          });
        },
        error: (err) => {
          const problem = this.extractProblemDetails(err);
          this.errorMessage.set(
            problem.title ||
              'No fue posible activar tu contexto profesional en este momento',
          );
          this.isLoading.set(false);
        },
      });
  }

  private switchAndNavigateProfessional(user: CurrentUserDto): void {
    const professionalContext = user.contexts.find(
      (ctx) => ctx.type === 'PROFESSIONAL',
    );

    if (professionalContext) {
      this.authStore.switchContext(professionalContext);
    }

    const displayName = user.name || user.email || 'usuario';
    this.toast.success(`¡Bienvenido, ${displayName}!`);
    this.isLoading.set(false);
    this.postLoginNavigation.navigateByContext();
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
