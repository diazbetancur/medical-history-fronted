import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { AuthApi } from '@data/api';

@Component({
  selector: 'app-forgot-password-page',
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
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss',
})
export class ForgotPasswordPageComponent {
  private readonly authApi = inject(AuthApi);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly isLoading = signal(false);
  readonly resultMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.resultMessage.set(null);

    this.authApi
      .forgotPassword({ email: this.form.getRawValue().email })
      .subscribe({
        next: (response) => {
          this.resultMessage.set(
            response.message ||
              'Si el email existe, se generó un token de recuperación',
          );
        },
        error: (error) => {
          this.errorMessage.set(
            error?.error?.title ||
              error?.error?.message ||
              'No fue posible procesar la solicitud.',
          );
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
  }
}
