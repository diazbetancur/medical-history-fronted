import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import type { CreateUserDto } from '@data/api/admin-users.types';
import { AdminUsersStore } from '@data/stores/admin-users.store';
import { FormControlErrorComponent, FormLabelComponent } from '@shared/ui/forms';
import { RoleLabelPipe } from '@shared/pipes/role-label.pipe';

@Component({
  selector: 'app-user-create-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    FormLabelComponent,
    FormControlErrorComponent,
    RoleLabelPipe,
  ],
  templateUrl: './user-create.dialog.html',
  styleUrl: './user-create.dialog.scss',
})
export class UserCreateDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<UserCreateDialogComponent>);
  private readonly store = inject(AdminUsersStore);
  private readonly fb = inject(FormBuilder);

  readonly saving = this.store.saving;
  readonly availableRoles = this.store.roleNames;
  readonly loadingRoles = this.store.loadingRoles;
  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly submitted = signal(false);

  readonly form: FormGroup = this.fb.group(
    {
      userName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
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
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      phone: [''],
      roles: [[] as string[]],
      sendWelcomeEmail: [true],
    },
    { validators: this.passwordMatchValidator },
  );

  ngOnInit(): void {
    if (this.availableRoles().length === 0) {
      this.store.loadRolesCatalog();
    }
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);

    const formValue = this.form.getRawValue();
    const dto: CreateUserDto = {
      userName: formValue.userName.trim(),
      email: formValue.email.trim(),
      password: formValue.password,
      confirmPassword: formValue.confirmPassword,
      roles: formValue.roles || [],
      profile: {
        firstName: formValue.firstName.trim(),
        lastName: formValue.lastName.trim(),
        phone: formValue.phone?.trim() || undefined,
      },
      sendWelcomeEmail: formValue.sendWelcomeEmail,
    };

    this.store.createUser(dto);

    const checkComplete = setInterval(() => {
      if (this.saving()) {
        return;
      }

      clearInterval(checkComplete);
      const error = this.store.error();
      if (error) {
        this.errorMessage.set(error.message || 'Error al crear el usuario');
      } else {
        this.dialogRef.close({ success: true });
      }
    }, 100);

    setTimeout(() => clearInterval(checkComplete), 30000);
  }

  private passwordMatchValidator(
    group: FormGroup,
  ): { passwordMismatch: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
}