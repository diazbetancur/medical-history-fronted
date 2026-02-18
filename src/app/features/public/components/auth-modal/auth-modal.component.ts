import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
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
import { AuthIntentService } from '../../services/auth-intent.service';

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
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  // ─── Register form ────────────────────────────────────────────────────────
  readonly registerForm = this.fb.group(
    {
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
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

  selectedTabIndex = 0;

  ngOnInit(): void {
    this.selectedTabIndex = this.data.initialTab ?? 0;
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  onLoginSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoginLoading.set(true);
    this.loginError.set(null);

    const credentials = this.loginForm.getRawValue();

    this.authApi
      .login({ email: credentials.email, password: credentials.password })
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
              this.loginError.set(this.extractTitle(err));
              this.isLoginLoading.set(false);
            },
          });
        },
        error: (err) => {
          this.loginError.set(
            this.extractTitle(err) || 'Credenciales inválidas',
          );
          this.isLoginLoading.set(false);
        },
      });
  }

  // ─── Register ─────────────────────────────────────────────────────────────
  onRegisterSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isRegisterLoading.set(true);
    this.registerError.set(null);

    const value = this.registerForm.getRawValue();

    this.authApi
      .register({
        email: value.email!,
        password: value.password!,
        confirmPassword: value.confirmPassword!,
        firstName: value.firstName!,
        lastName: value.lastName!,
        phoneNumber: value.phoneNumber || undefined,
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
          this.registerError.set(
            this.extractTitle(err) || 'No fue posible registrar el usuario',
          );
          this.isRegisterLoading.set(false);
        },
      });
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
            .login({ email: credentials.email, password: credentials.password })
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
                    this.loginError.set(
                      this.extractTitle(err) || 'Error al cargar la sesión',
                    );
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
          this.loginError.set(
            this.extractTitle(err) ||
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
  private extractTitle(error: unknown): string {
    if (
      error &&
      typeof error === 'object' &&
      'error' in error &&
      error.error &&
      typeof error.error === 'object'
    ) {
      const err = error.error as Partial<ProblemDetails>;
      if (err.title) return err.title;
    }
    return '';
  }

  private passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;
      if (!password || !confirmPassword) return null;
      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }
}
