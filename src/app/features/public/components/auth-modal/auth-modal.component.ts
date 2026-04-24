import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormGroup,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterLink } from '@angular/router';
import { AuthStore, PostLoginNavigationService } from '@core/auth';
import { CurrentUserDto, ProblemDetails } from '@core/models';
import { AuthApi } from '@data/api';
import { ToastService } from '@shared/services';
import { FormControlErrorComponent, FormLabelComponent } from '@shared/ui/forms';
import { AuthIntentService } from '../../services/auth-intent.service';
import {
  LoginFormMessages,
  PasswordComplexityHelpText,
  RegisterFormMessages,
} from '../../pages/auth-form-messages';

export interface AuthModalData {
  /** true cuando se abrió desde "Soy Médico" */
  asProfessional: boolean;
  /** 0 = Login tab, 1 = Register tab */
  initialTab?: number;
}

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatDialogModule,
    MatTabsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    FormControlErrorComponent,
    FormLabelComponent,
  ],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.scss'],
})
export class AuthModalComponent implements OnInit {
  private readonly authApi = inject(AuthApi);
  private readonly authStore = inject(AuthStore);
  private readonly postLoginNavigation = inject(PostLoginNavigationService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);
  private readonly authIntent = inject(AuthIntentService);
  private readonly router = inject(Router);
  protected readonly dialogRef = inject(MatDialogRef<AuthModalComponent>);

  readonly data: AuthModalData = inject(MAT_DIALOG_DATA);

  // ─── Login form ───────────────────────────────────────────────────────────
  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  // ─── Register form ────────────────────────────────────────────────────────
  readonly registerForm = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(256)],
      ],
      phoneNumber: [
        '',
        [
          Validators.maxLength(20),
          this.phoneValidator(),
        ],
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(100),
          Validators.pattern(
            /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/,
          ),
        ],
      ],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [this.passwordMatchValidator()] },
  );

  readonly isLoginLoading = signal(false);
  readonly isRegisterLoading = signal(false);
  readonly loginError = signal<string | null>(null);
  readonly registerError = signal<string | null>(null);
  readonly registerSuccess = signal(false);
  readonly loginSubmitted = signal(false);
  readonly registerSubmitted = signal(false);
  readonly loginFormMessages = LoginFormMessages;
  readonly registerFormMessages = RegisterFormMessages;
  readonly passwordComplexityHelpText = PasswordComplexityHelpText;
  readonly showLoginPassword = signal(false);
  readonly showRegisterPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  selectedTabIndex = 0;

  ngOnInit(): void {
    this.selectedTabIndex = this.data.initialTab ?? 0;
    this.setupServerErrorCleanup(this.loginForm);
    this.setupServerErrorCleanup(this.registerForm);
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  onLoginSubmit(): void {
    this.loginSubmitted.set(true);
    this.clearServerFieldErrors(this.loginForm);

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Ensure a clean session before attempting a new login
    this.authStore.resetForLogin();

    this.isLoginLoading.set(true);
    this.loginError.set(null);

    const credentials = this.loginForm.getRawValue();

    this.authApi
      .login({ email: credentials.email.trim(), password: credentials.password })
      .subscribe({
        next: (response) => {
          this.authStore.setToken(response.token, response.expiresAt);
          this.authStore.loadMe().subscribe({
            next: (user) => {
              if (user) {
                this.handlePostLogin(user, this.data.asProfessional);
              } else {
                this.loginError.set('Error al cargar la sesión');
                this.isLoginLoading.set(false);
              }
            },
            error: (err) => {
              const problem = this.extractProblemDetails(err);
              this.loginError.set(problem.title || 'Error al cargar la sesión');
              this.isLoginLoading.set(false);
            },
          });
        },
        error: (err) => {
          const problem = this.extractProblemDetails(err);
          const hasFieldErrors = this.applyServiceFieldErrors(
            this.loginForm,
            problem.errors,
          );
          this.loginError.set(
            hasFieldErrors ? null : problem.title || 'Credenciales inválidas',
          );
          this.isLoginLoading.set(false);
        },
      });
  }

  // ─── Register ─────────────────────────────────────────────────────────────
  onRegisterSubmit(): void {
    this.registerSubmitted.set(true);
    this.clearServerFieldErrors(this.registerForm);

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isRegisterLoading.set(true);
    this.registerError.set(null);

    const value = this.registerForm.getRawValue();

    this.authApi
      .register({
        email: value.email!.trim(),
        password: value.password!,
        confirmPassword: value.confirmPassword!,
        firstName: value.firstName!.trim(),
        lastName: value.lastName!.trim(),
        phoneNumber: value.phoneNumber?.trim() || undefined,
      })
      .subscribe({
        next: (response) => {
          this.toast.success(response.message || 'Cuenta creada exitosamente');
          this.registerSuccess.set(true);
          this.isRegisterLoading.set(false);

          // Pre-fill email in login tab and switch to it
          this.loginForm.controls.email.setValue(value.email!);
          this.selectedTabIndex = 0;
        },
        error: (err) => {
          const problem = this.extractProblemDetails(err);
          const hasFieldErrors = this.applyServiceFieldErrors(
            this.registerForm,
            problem.errors,
          );
          this.registerError.set(
            hasFieldErrors
              ? null
              : problem.title || 'No fue posible registrar el usuario',
          );
          this.isRegisterLoading.set(false);
        },
      });
  }

  toggleLoginPasswordVisibility(): void {
    this.showLoginPassword.update((value) => !value);
  }

  toggleRegisterPasswordVisibility(): void {
    this.showRegisterPassword.update((value) => !value);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  // ─── Post-login ───────────────────────────────────────────────────────────
  /**
   * Flujo según contrato API:
   * 1. asProfessional = false → navigateByContext normal
   * 2. Rol incluye 'Professional':
   *    a. hasProfessionalProfile = true  → switch context + /professional
   *    b. hasProfessionalProfile = false → /professional/onboarding
   * 3. Solo 'Client' → POST become-professional → re-login (nuevo token)
   *    → loadMe → /professional/onboarding
   */
  private handlePostLogin(user: CurrentUserDto, asProfessional: boolean): void {
    this.authIntent.clear();

    // ── Flujo normal (paciente) ──────────────────────────────────────────────
    if (!asProfessional) {
      const displayName = user.name || user.email || 'usuario';
      this.toast.success(`¡Bienvenido, ${displayName}!`);
      this.isLoginLoading.set(false);
      this.dialogRef.close(true);
      this.postLoginNavigation.navigateByContext();
      return;
    }

    // ── Usuario ya es Professional ───────────────────────────────────────────
    const isProfessional = user.roles.some(
      (r) => r.toLowerCase() === 'professional',
    );

    if (isProfessional) {
      this.navigateAsProfessional(user);
      return;
    }

    // ── Usuario es Client → promover a Professional ──────────────────────────
    this.authApi
      .becomeProfessional({ reason: 'Activación desde botón Soy Médico' })
      .subscribe({
        next: (result) => {
          if (!result.success) {
            this.loginError.set(
              result.message || 'No fue posible activar el perfil profesional.',
            );
            this.isLoginLoading.set(false);
            return;
          }

          // Re-login para obtener nuevo token con rol Professional
          const credentials = this.loginForm.getRawValue();
          this.authApi
            .login({ email: credentials.email.trim(), password: credentials.password })
            .subscribe({
              next: (loginResponse) => {
                this.authStore.setToken(
                  loginResponse.token,
                  loginResponse.expiresAt,
                );
                this.authStore.loadMe().subscribe({
                  next: (updatedUser) => {
                    if (!updatedUser) {
                      this.loginError.set(
                        'No se pudo cargar la sesión actualizada',
                      );
                      this.isLoginLoading.set(false);
                      return;
                    }
                    this.toast.success('¡Cuenta profesional activada!');
                    this.navigateAsProfessional(updatedUser);
                  },
                  error: (err) => {
                    const problem = this.extractProblemDetails(err);
                    this.loginError.set(problem.title || 'Error al cargar la sesión');
                    this.isLoginLoading.set(false);
                  },
                });
              },
              error: (err) => {
                // Token refresh failed — still navigate to onboarding
                this.toast.success(
                  '¡Cuenta profesional activada! Ingresa nuevamente.',
                );
                this.isLoginLoading.set(false);
                this.dialogRef.close(true);
              },
            });
        },
        error: (err) => {
          const problem = this.extractProblemDetails(err);
          this.loginError.set(
            problem.title ||
              'No fue posible activar tu perfil profesional en este momento',
          );
          this.isLoginLoading.set(false);
        },
      });
  }

  /**
   * Decide entre ir al dashboard (perfil ya existe) o al onboarding (nuevo).
   */
  private navigateAsProfessional(user: CurrentUserDto): void {
    const displayName = user.name || user.email || 'usuario';
    const professionalContext = user.contexts.find(
      (ctx) => ctx.type === 'PROFESSIONAL',
    );

    if (professionalContext) {
      this.authStore.switchContext(professionalContext);
    }

    this.isLoginLoading.set(false);
    this.dialogRef.close(true);

    if (user.hasProfessionalProfile) {
      this.toast.success(`¡Bienvenido, ${displayName}!`);
      this.router.navigate(['/professional']);
    } else {
      this.toast.success(
        `¡Hola ${displayName}! Configura tu perfil para empezar.`,
      );
      this.router.navigate(['/professional/onboarding']);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
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
      title: 'Error en la solicitud',
      status: 500,
    };
  }

  private setupServerErrorCleanup(form: FormGroup): void {
    Object.values(form.controls).forEach((control) => {
      control.valueChanges.subscribe(() => {
        this.clearServerError(control);
      });
    });
  }

  private clearServerFieldErrors(form: FormGroup): void {
    Object.values(form.controls).forEach((control) => {
      this.clearServerError(control);
    });
  }

  private clearServerError(control: AbstractControl): void {
    const current = control.errors;
    if (!current || !('server' in current)) {
      return;
    }

    const { server: _removedServerError, ...rest } = current;
    control.setErrors(Object.keys(rest).length > 0 ? rest : null);
  }

  private applyServiceFieldErrors(
    form: FormGroup,
    errors?: Record<string, string[]>,
  ): boolean {
    if (!errors) {
      return false;
    }

    let applied = false;

    for (const [backendField, messages] of Object.entries(errors)) {
      const controlName = this.mapServiceFieldToControlName(backendField);
      if (!controlName) {
        continue;
      }

      const control = form.get(controlName);
      if (!control) {
        continue;
      }

      const serverMessage = messages?.[0]?.trim();
      if (!serverMessage) {
        continue;
      }

      const existingErrors = control.errors;
      control.setErrors(
        existingErrors
          ? { ...existingErrors, server: serverMessage }
          : { server: serverMessage },
      );
      control.markAsTouched();
      applied = true;
    }

    return applied;
  }

  private mapServiceFieldToControlName(field: string): string | null {
    const normalized = field.replaceAll(/[^a-zA-Z]/g, '').toLowerCase();

    const dictionary: Record<string, string> = {
      email: 'email',
      password: 'password',
      firstname: 'firstName',
      lastname: 'lastName',
      phonenumber: 'phoneNumber',
    };

    if (normalized === 'confirm' + 'password') {
      return 'confirmPassword';
    }

    return dictionary[normalized] ?? null;
  }

  private passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;
      if (!password || !confirmPassword) return null;
      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }

  private phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null; // Empty is valid (optional field)

      // Allow: digits, +, -, (, ), space
      // Must contain at least some digits
      const hasDigits = /\d/.test(value);
      const validChars = /^[0-9+\-() ]+$/.test(value);

      if (!hasDigits || !validChars) {
        return { invalidPhone: true };
      }
      return null;
    };
  }
}
