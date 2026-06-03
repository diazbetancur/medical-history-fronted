import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
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
import { RouterLink } from '@angular/router';
import { AuthStore, PostLoginNavigationService } from '@core/auth';
import { CurrentUserDto, ProblemDetails } from '@core/models';
import { AuthApi } from '@data/api';
import { ToastService } from '@shared/services';
import {
  FormErrorMessage,
  FormErrorMessageMap,
} from '@shared/utils/form-validation';
import {
  LoginFormMessages,
  RegisterFormMessages,
} from '../../pages/auth-form-messages';

export interface AuthModalData {
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
  protected readonly dialogRef = inject(MatDialogRef<AuthModalComponent>);

  readonly data: AuthModalData = inject(MAT_DIALOG_DATA, {
    optional: true,
  }) ?? {};

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
      phoneNumber: ['', [Validators.maxLength(20), this.phoneValidator()]],
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
  readonly showLoginPassword = signal(false);
  readonly showRegisterPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly passwordChecklistItems = [
    { key: 'length', label: '8+ caracteres' },
    { key: 'mixedCase', label: 'Mayúscula y minúscula' },
    { key: 'digit', label: 'Número' },
    { key: 'symbol', label: 'Símbolo' },
  ] as const;

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
      .login({
        email: credentials.email.trim(),
        password: credentials.password,
      })
      .subscribe({
        next: (response) => {
          this.authStore.setToken(response.token, response.expiresAt);
          this.authStore.loadMe().subscribe({
            next: (user) => {
              if (user) {
                this.handlePostLogin(user);
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
        phoneNumber: this.normalizeOptionalPhone(value.phoneNumber),
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

  private normalizeOptionalPhone(value: unknown): string | undefined {
    if (value == null) {
      return undefined;
    }

    if (typeof value === 'string') {
      const normalized = value.trim();
      return normalized.length > 0 ? normalized : undefined;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      const normalized = String(value).trim();
      return normalized.length > 0 ? normalized : undefined;
    }

    return undefined;
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

  shouldShowLoginError(controlName: string): boolean {
    return this.shouldShowControlError(
      this.loginForm.get(controlName),
      this.loginSubmitted(),
    );
  }

  shouldShowRegisterError(controlName: string): boolean {
    return this.shouldShowControlError(
      this.registerForm.get(controlName),
      this.registerSubmitted(),
    );
  }

  getLoginEmailError(): string | null {
    if (!this.shouldShowLoginError('email')) {
      return null;
    }

    return (
      this.getMessageFromMap(
        this.loginForm.controls.email,
        this.loginFormMessages.email,
        ['server', 'required', 'email'],
      ) ?? 'Revisa el correo ingresado.'
    );
  }

  getLoginPasswordError(): string | null {
    if (!this.shouldShowLoginError('password')) {
      return null;
    }

    return (
      this.getMessageFromMap(
        this.loginForm.controls.password,
        this.loginFormMessages.password,
        ['server', 'required'],
      ) ?? 'Revisa la contraseña ingresada.'
    );
  }

  getRegisterFirstNameError(): string | null {
    if (!this.shouldShowRegisterError('firstName')) {
      return null;
    }

    return (
      this.getMessageFromMap(
        this.registerForm.controls.firstName,
        this.registerFormMessages.firstName,
        ['server', 'required', 'maxlength'],
      ) ?? 'Revisa el nombre ingresado.'
    );
  }

  getRegisterLastNameError(): string | null {
    if (!this.shouldShowRegisterError('lastName')) {
      return null;
    }

    return (
      this.getMessageFromMap(
        this.registerForm.controls.lastName,
        this.registerFormMessages.lastName,
        ['server', 'required', 'maxlength'],
      ) ?? 'Revisa el apellido ingresado.'
    );
  }

  getRegisterEmailError(): string | null {
    if (!this.shouldShowRegisterError('email')) {
      return null;
    }

    return (
      this.getMessageFromMap(
        this.registerForm.controls.email,
        this.registerFormMessages.email,
        ['server', 'required', 'email', 'maxlength'],
      ) ?? 'Revisa el correo ingresado.'
    );
  }

  getRegisterPhoneError(): string | null {
    if (!this.shouldShowRegisterError('phoneNumber')) {
      return null;
    }

    return (
      this.getMessageFromMap(
        this.registerForm.controls.phoneNumber,
        this.registerFormMessages.phoneNumber,
        ['server', 'maxlength', 'invalidPhone'],
      ) ?? 'Revisa el teléfono ingresado.'
    );
  }

  getRegisterPasswordError(): string | null {
    const control = this.registerForm.controls.password;

    if (!this.shouldShowRegisterError('password')) {
      return null;
    }

    if (control.hasError('server')) {
      return this.getMessageFromMap(
        control,
        this.registerFormMessages.password,
        ['server'],
      );
    }

    if (control.hasError('required')) {
      return 'La contraseña es obligatoria.';
    }

    if (
      this.registerSubmitted() &&
      (control.hasError('minlength') ||
        control.hasError('maxlength') ||
        control.hasError('pattern'))
    ) {
      return 'La contraseña no cumple los requisitos.';
    }

    return null;
  }

  getRegisterConfirmPasswordError(): string | null {
    const control = this.registerForm.controls.confirmPassword;
    const shouldShowError = this.registerSubmitted() || control.touched;

    if (!shouldShowError) {
      return null;
    }

    if (control.hasError('required')) {
      return 'Confirma tu contraseña.';
    }

    if (this.shouldShowRegisterPasswordMismatch()) {
      return 'Las contraseñas no coinciden.';
    }

    if (control.hasError('server')) {
      return this.getMessageFromMap(
        control,
        this.registerFormMessages.confirmPassword,
        ['server'],
      );
    }

    return null;
  }

  isPasswordRequirementMet(
    requirement: 'length' | 'mixedCase' | 'digit' | 'symbol',
  ): boolean {
    const value = this.registerForm.controls.password.value ?? '';

    switch (requirement) {
      case 'length':
        return value.length >= 8;
      case 'mixedCase':
        return /[A-Z]/.test(value) && /[a-z]/.test(value);
      case 'digit':
        return /\d/.test(value);
      case 'symbol':
        return /[^A-Za-z0-9]/.test(value);
    }
  }

  // ─── Post-login ───────────────────────────────────────────────────────────
  private handlePostLogin(user: CurrentUserDto): void {
    const displayName = user.name || user.email || 'usuario';

    this.isLoginLoading.set(false);
    this.dialogRef.close(true);
    this.toast.success(`¡Bienvenido, ${displayName}!`);
    this.postLoginNavigation.navigateAfterLogin();
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

  private shouldShowControlError(
    control: AbstractControl | null,
    submitted: boolean,
  ): boolean {
    return !!control && control.invalid && (control.touched || submitted);
  }

  private shouldShowRegisterPasswordMismatch(): boolean {
    const passwordControl = this.registerForm.controls.password;
    const confirmPasswordControl = this.registerForm.controls.confirmPassword;
    const password = passwordControl.value ?? '';
    const confirmPassword = confirmPasswordControl.value ?? '';

    return (
      !!confirmPassword &&
      password !== confirmPassword &&
      (this.registerSubmitted() || confirmPasswordControl.touched)
    );
  }

  private getMessageFromMap(
    control: AbstractControl | null,
    messages: FormErrorMessageMap,
    order: string[],
  ): string | null {
    if (!control?.errors) {
      return null;
    }

    for (const errorKey of order) {
      if (!control.hasError(errorKey)) {
        continue;
      }

      const message = messages[errorKey];
      if (!message) {
        continue;
      }

      return this.resolveMessage(message, control.getError(errorKey));
    }

    return null;
  }

  private resolveMessage(
    message: FormErrorMessage,
    errorValue: unknown,
    control: AbstractControl | null = null,
  ): string {
    return typeof message === 'function'
      ? message(errorValue, control)
      : message;
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
