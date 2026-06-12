import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthStore, PostLoginNavigationService } from '@core/auth';
import { CurrentUserDto, ProblemDetails } from '@core/models';
import { AuthApi } from '@data/api';
import { ToastService } from '@shared/services';
import {
  FormControlErrorComponent,
  FormLabelComponent,
} from '@shared/ui/forms';
import { LoginFormMessages } from '../auth-form-messages';

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
    FormControlErrorComponent,
    FormLabelComponent,
  ],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPageComponent implements OnInit {
  private readonly authApi = inject(AuthApi);
  private readonly authStore = inject(AuthStore);
  private readonly postLoginNavigation = inject(PostLoginNavigationService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly submitted = signal(false);
  readonly isFormInvalid = computed(() => {
    this.formValidityTrigger();
    return this.form.invalid;
  });

  readonly loginFormMessages = LoginFormMessages;

  private readonly formValidityTrigger = signal(0);

  ngOnInit(): void {
    this.setupFormValidationTracking();
  }

  private setupFormValidationTracking(): void {
    this.form.valueChanges.subscribe(() => {
      this.formValidityTrigger.update((v) => v + 1);
    });

    this.form.statusChanges.subscribe(() => {
      this.formValidityTrigger.update((v) => v + 1);
    });
  }

  /**
   * Submit login form
   * 1. Call AuthApi.login() to get token
   * 2. Call AuthStore.setToken() to persist
   * 3. Call AuthStore.loadMe() to fetch user + contexts
   * 4. Redirect to dashboard on success
   */
  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Ensure a clean session before attempting a new login
    this.authStore.resetForLogin();

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const credentials = this.form.getRawValue();

    this.authApi
      .login({
        email: credentials.email.trim(),
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
                this.handlePostLogin(user);
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

    if (email) {
      this.form.controls.email.setValue(email);
    }
  }

  private handlePostLogin(user: CurrentUserDto): void {
    const displayName = user.name || user.email || 'usuario';
    this.isLoading.set(false);
    this.toast.success(`¡Bienvenido, ${displayName}!`);

    const returnTo = this.route.snapshot.queryParamMap.get('returnTo');
    const accessiblePaths = this.postLoginNavigation.getAvailableContextPaths();
    if (returnTo?.startsWith('/') && accessiblePaths.some((p) => returnTo.startsWith(p))) {
      void this.router.navigateByUrl(returnTo);
    } else {
      this.postLoginNavigation.navigateAfterLogin();
    }
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
