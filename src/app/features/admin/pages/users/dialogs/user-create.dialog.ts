import { Component, inject, OnInit, signal } from '@angular/core';
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
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>person_add</mat-icon>
      Crear Usuario
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="user-form">
        <!-- Account Section -->
        <div class="form-section">
          <h3>Cuenta</h3>

          <mat-form-field appearance="outline">
            <mat-label>Nombre de usuario</mat-label>
            <input
              matInput
              formControlName="userName"
              placeholder="usuario123"
            />
            <mat-icon matPrefix>account_circle</mat-icon>
            @if (form.get('userName')?.hasError('required')) {
              <mat-error>El nombre de usuario es requerido</mat-error>
            }
            @if (form.get('userName')?.hasError('minlength')) {
              <mat-error>Mínimo 3 caracteres</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input
              matInput
              formControlName="email"
              type="email"
              placeholder="usuario@ejemplo.com"
            />
            <mat-icon matPrefix>email</mat-icon>
            @if (form.get('email')?.hasError('required')) {
              <mat-error>El email es requerido</mat-error>
            }
            @if (form.get('email')?.hasError('email')) {
              <mat-error>Formato de email inválido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Contraseña</mat-label>
            <input
              matInput
              formControlName="password"
              [type]="showPassword() ? 'text' : 'password'"
            />
            <mat-icon matPrefix>lock</mat-icon>
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="togglePassword()"
            >
              <mat-icon>{{
                showPassword() ? 'visibility_off' : 'visibility'
              }}</mat-icon>
            </button>
            @if (form.get('password')?.hasError('required')) {
              <mat-error>La contraseña es requerida</mat-error>
            }
            @if (form.get('password')?.hasError('minlength')) {
              <mat-error>Mínimo 8 caracteres</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Confirmar contraseña</mat-label>
            <input
              matInput
              formControlName="confirmPassword"
              [type]="showPassword() ? 'text' : 'password'"
            />
            <mat-icon matPrefix>lock_outline</mat-icon>
            @if (form.get('confirmPassword')?.hasError('required')) {
              <mat-error>Confirma la contraseña</mat-error>
            }
            @if (form.hasError('passwordMismatch')) {
              <mat-error>Las contraseñas no coinciden</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- Profile Section -->
        <div class="form-section">
          <h3>Perfil (opcional)</h3>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="firstName" />
              <mat-icon matPrefix>badge</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Apellido</mat-label>
              <input matInput formControlName="lastName" />
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Teléfono</mat-label>
            <input
              matInput
              formControlName="phone"
              placeholder="+1 234 567 8900"
            />
            <mat-icon matPrefix>phone</mat-icon>
          </mat-form-field>
        </div>

        <!-- Roles Section -->
        <div class="form-section">
          <h3>Roles</h3>

          @if (loadingRoles()) {
            <div class="loading-inline">
              <mat-spinner diameter="20"></mat-spinner>
              <span>Cargando roles...</span>
            </div>
          } @else {
            <mat-form-field appearance="outline">
              <mat-label>Asignar roles</mat-label>
              <mat-select formControlName="roles" multiple>
                @for (role of availableRoles(); track role) {
                  <mat-option [value]="role">{{ role }}</mat-option>
                }
              </mat-select>
              <mat-icon matPrefix>shield</mat-icon>
              <mat-hint>Selecciona uno o más roles</mat-hint>
            </mat-form-field>
          }
        </div>

        <!-- Options -->
        <div class="form-section options">
          <mat-checkbox formControlName="sendWelcomeEmail">
            Enviar email de bienvenida
          </mat-checkbox>
        </div>
      </form>

      <!-- Error Message -->
      @if (errorMessage()) {
        <div class="error-banner">
          <mat-icon>error</mat-icon>
          <span>{{ errorMessage() }}</span>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="saving()">
        Cancelar
      </button>
      <button
        mat-raised-button
        color="primary"
        (click)="onSubmit()"
        [disabled]="saving() || form.invalid"
      >
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <mat-icon>person_add</mat-icon>
          Crear Usuario
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 400px;
        max-width: 500px;
      }

      h2[mat-dialog-title] {
        display: flex;
        align-items: center;
        gap: 12px;

        mat-icon {
          color: var(--mat-app-primary);
        }
      }

      .user-form {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .form-section {
        margin-bottom: 16px;

        h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 500;
          color: var(--mat-app-on-surface-variant);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        mat-form-field {
          width: 100%;
        }

        &.options {
          padding: 8px 0;
        }
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .loading-inline {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: var(--mat-app-surface-container);
        border-radius: 8px;
        font-size: 14px;
        color: var(--mat-app-on-surface-variant);
      }

      .error-banner {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        background: var(--mat-app-error-container);
        color: var(--mat-app-on-error-container);
        border-radius: 8px;
        margin-top: 16px;

        mat-icon {
          color: var(--mat-app-error);
          flex-shrink: 0;
        }

        span {
          font-size: 14px;
          line-height: 1.4;
        }
      }

      mat-dialog-actions button {
        mat-spinner {
          display: inline-block;
          margin-right: 8px;
        }
      }
    `,
  ],
})
export class UserCreateDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<UserCreateDialogComponent>);
  private readonly store = inject(AdminUsersStore);
  private readonly fb = inject(FormBuilder);

  // State
  readonly saving = this.store.saving;
  readonly availableRoles = this.store.roleNames;
  readonly loadingRoles = this.store.loadingRoles;
  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Form
  readonly form: FormGroup = this.fb.group(
    {
      userName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      firstName: [''],
      lastName: [''],
      phone: [''],
      roles: [['User']],
      sendWelcomeEmail: [true],
    },
    { validators: this.passwordMatchValidator },
  );

  ngOnInit(): void {
    // Ensure roles are loaded
    if (this.availableRoles().length === 0) {
      this.store.loadRolesCatalog();
    }
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);

    const formValue = this.form.value;
    const dto: CreateUserDto = {
      userName: formValue.userName,
      email: formValue.email,
      password: formValue.password,
      confirmPassword: formValue.confirmPassword,
      roles: formValue.roles || [],
      profile: {
        firstName: formValue.firstName || undefined,
        lastName: formValue.lastName || undefined,
        phone: formValue.phone || undefined,
      },
      sendWelcomeEmail: formValue.sendWelcomeEmail,
    };

    // Clean up empty profile
    if (
      !dto.profile?.firstName &&
      !dto.profile?.lastName &&
      !dto.profile?.phone
    ) {
      delete dto.profile;
    }

    this.store.createUser(dto);

    // Watch for completion
    const checkComplete = setInterval(() => {
      if (!this.saving()) {
        clearInterval(checkComplete);
        const error = this.store.error();
        if (error) {
          this.errorMessage.set(error.message || 'Error al crear el usuario');
        } else {
          this.dialogRef.close({ success: true });
        }
      }
    }, 100);

    // Timeout safety
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
