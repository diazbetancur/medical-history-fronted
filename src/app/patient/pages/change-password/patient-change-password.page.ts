import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { AuthApi } from '@data/api';
import { ToastService } from '@shared/services';

@Component({
  selector: 'app-patient-change-password-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './patient-change-password.page.html',
  styleUrl: './patient-change-password.page.scss',
})
export class PatientChangePasswordPage {
  private readonly authApi = inject(AuthApi);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/),
      ],
    ],
    confirmNewPassword: ['', [Validators.required]],
  });

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    if (value.newPassword !== value.confirmNewPassword) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authApi
      .changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
        confirmNewPassword: value.confirmNewPassword,
      })
      .subscribe({
        next: (result) => {
          this.toast.success(result.message || 'Contraseña actualizada correctamente');
          this.router.navigate(['/patient/profile']);
        },
        error: (error) => {
          this.errorMessage.set(
            error?.error?.title ||
              error?.error?.message ||
              'No fue posible cambiar la contraseña.',
          );
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/patient/profile']);
  }
}
