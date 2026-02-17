import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { ProblemDetails } from '@core/models';
import { AuthApi } from '@data/api';
import { ToastService } from '@shared/services';

@Component({
  selector: 'app-register-page',
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
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPageComponent {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group(
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
    {
      validators: [this.passwordMatchValidator()],
    },
  );

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();

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
          this.toast.success(
            response.message || 'Usuario registrado exitosamente',
          );
          this.router.navigate(['/login'], {
            queryParams: { registered: '1' },
          });
        },
        error: (err) => {
          const problem = this.extractProblemDetails(err);
          this.errorMessage.set(
            problem.title || 'No fue posible registrar el usuario',
          );
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
  }

  private passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;

      if (!password || !confirmPassword) {
        return null;
      }

      return password === confirmPassword ? null : { passwordMismatch: true };
    };
  }

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
      title: 'Error al registrar usuario',
      status: 500,
    };
  }
}
