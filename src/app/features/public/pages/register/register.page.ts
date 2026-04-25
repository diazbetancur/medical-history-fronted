import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { ProblemDetails } from '@core/models';
import { AuthApi } from '@data/api';
import { ToastService } from '@shared/services';
import { FormControlErrorComponent, FormLabelComponent } from '@shared/ui/forms';
import { RegisterFormMessages, PasswordComplexityHelpText } from '../auth-form-messages';

@Component({
  selector: 'app-register-page',
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
    FormControlErrorComponent,
    FormLabelComponent,
  ],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPageComponent implements OnInit {
  private readonly authApi = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(256)],
      ],
      phoneNumber: ['', [Validators.maxLength(20)]],
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
      asProfessional: [false],
    },
    {
      validators: [this.passwordMatchValidator()],
    },
  );

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly submitted = signal(false);

  readonly registerFormMessages = RegisterFormMessages;
  readonly passwordComplexityHelpText = PasswordComplexityHelpText;

  // Monitor form validity using a signal that updates on value changes
  private formValidityTrigger = signal(0);
  readonly isFormInvalid = computed(() => {
    // Force update when form validity changes
    this.formValidityTrigger();
    return this.form.invalid;
  });

  ngOnInit(): void {
    this.setupFormValidationTracking();
  }

  private setupFormValidationTracking(): void {
    this.form.valueChanges.subscribe(() => {
      this.formValidityTrigger.update(v => v + 1);
    });
    
    // Also trigger on status changes (for validators)
    this.form.statusChanges.subscribe(() => {
      this.formValidityTrigger.update(v => v + 1);
    });
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const value = this.form.getRawValue();

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
          this.toast.success(
            response.message || 'Usuario registrado exitosamente',
          );
          this.router.navigate(['/login'], {
            queryParams: {
              registered: '1',
              professional: value.asProfessional ? '1' : undefined,
              email: value.email,
            },
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
