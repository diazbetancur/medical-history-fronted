import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthApi } from '@data/api';

@Component({
  selector: 'app-reset-password-page',
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
  templateUrl: './reset-password.page.html',
  styleUrl: './reset-password.page.scss',
})
export class ResetPasswordPageComponent implements OnInit {
  private readonly authApi = inject(AuthApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // ── Detect invalid / missing link params ──────────────────────────────────
  readonly invalidLink =
    !this.route.snapshot.queryParamMap.get('email') ||
    !this.route.snapshot.queryParamMap.get('token');

  // ── Form ──────────────────────────────────────────────────────────────────
  // email + token are hidden from the UI but are sent to the API.
  // They are pre-populated from the URL query params.
  readonly form = this.fb.nonNullable.group({
    email: [
      this.route.snapshot.queryParamMap.get('email') ?? '',
      [Validators.required, Validators.email],
    ],
    token: [
      this.route.snapshot.queryParamMap.get('token') ?? '',
      [Validators.required],
    ],
    newPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        Validators.pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/),
      ],
    ],
    confirmNewPassword: ['', [Validators.required]],
  });

  // ── UI state ──────────────────────────────────────────────────────────────
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly submitted = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  // ── Password requirement getters (read from the live control value) ────────
  private get pw(): string {
    return this.form.controls.newPassword.value;
  }
  get hasMinLength(): boolean { return this.pw.length >= 8; }
  get hasUppercase(): boolean { return /[A-Z]/.test(this.pw); }
  get hasLowercase(): boolean { return /[a-z]/.test(this.pw); }
  get hasNumber(): boolean { return /\d/.test(this.pw); }
  get hasSymbol(): boolean { return /[^A-Za-z0-9]/.test(this.pw); }
  get allRequirementsMet(): boolean {
    return this.hasMinLength && this.hasUppercase && this.hasLowercase &&
      this.hasNumber && this.hasSymbol;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Cross-field validator: set / clear passwordsMismatch on confirmNewPassword
    // so MatFormField detects the invalid state and shows mat-error correctly.
    const syncMismatch = () => {
      const pw = this.form.controls.newPassword.value;
      const confirm = this.form.controls.confirmNewPassword.value;
      const ctrl = this.form.controls.confirmNewPassword;

      if (pw && confirm && pw !== confirm) {
        ctrl.setErrors({ ...ctrl.errors, passwordsMismatch: true });
      } else if (ctrl.hasError('passwordsMismatch')) {
        const { passwordsMismatch: _, ...rest } = ctrl.errors ?? {};
        ctrl.setErrors(Object.keys(rest).length ? rest : null);
      }
    };

    this.form.controls.newPassword.valueChanges.subscribe(syncMismatch);
    this.form.controls.confirmNewPassword.valueChanges.subscribe(syncMismatch);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isLoading.set(true);

    const value = this.form.getRawValue();

    this.authApi
      .resetPassword({
        email: value.email.trim(),
        token: value.token.trim(),
        newPassword: value.newPassword,
        confirmNewPassword: value.confirmNewPassword,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          // Navegar al home con ?passwordReset=1.
          // El HomePageComponent detecta ese param, muestra el toast de éxito
          // y abre el modal de login automáticamente.
          this.router.navigate(['/'], { queryParams: { passwordReset: '1' } });
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            error?.error?.title ??
              error?.error?.message ??
              'No fue posible restablecer la contraseña. El enlace puede haber expirado.',
          );
        },
      });
  }
}
