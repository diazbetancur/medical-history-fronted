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
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>person_add</mat-icon>
      Crear usuario
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="user-form">
        <div class="form-section">
          <h3>Cuenta</h3>

          <mat-form-field appearance="outline">
            <mat-label>
              <app-form-label
                text="Nombre de usuario"
                [required]="true"
              ></app-form-label>
            </mat-label>
            <input
              matInput
              formControlName="userName"
              placeholder="Ingresa el nombre de usuario"
            />
            <mat-icon matPrefix>account_circle</mat-icon>
            <app-form-control-error
              [control]="form.controls['userName']"
              [submitted]="submitted()"
            ></app-form-control-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>
              <app-form-label text="Email" [required]="true"></app-form-label>
            </mat-label>
            <input
              matInput
              formControlName="email"
              type="email"
              placeholder="Ingresa un correo valido"
            />
            <mat-icon matPrefix>email</mat-icon>
            <app-form-control-error
              [control]="form.controls['email']"
              [submitted]="submitted()"
            ></app-form-control-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>
              <app-form-label
                text="Contrasena"
                [required]="true"
              ></app-form-label>
            </mat-label>
            <input
              matInput
              formControlName="password"
              [type]="showPassword() ? 'text' : 'password'"
              placeholder="Crea una contrasena segura"
            />
            <mat-icon matPrefix>lock</mat-icon>
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="togglePassword()"
              aria-label="Mostrar u ocultar contrasena"
            >
              <mat-icon>{{
                showPassword() ? 'visibility_off' : 'visibility'
              }}</mat-icon>
            </button>
            <app-form-control-error
              [control]="form.controls['password']"
              [submitted]="submitted()"
              [messages]="{
                minlength: 'Debes ingresar al menos 8 caracteres',
                pattern: 'La contrasena debe incluir mayuscula, minuscula, numero y simbolo'
              }"
            ></app-form-control-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Confirmar contrasena</mat-label>
            <input
              matInput
              formControlName="confirmPassword"
              [type]="showPassword() ? 'text' : 'password'"
              placeholder="Confirma la contrasena"
            />
            <mat-icon matPrefix>lock_outline</mat-icon>
            <app-form-control-error
              [control]="form.controls['confirmPassword']"
              [submitted]="submitted()"
            ></app-form-control-error>
            @if (
              form.hasError('passwordMismatch') &&
              (submitted() ||
                form.controls['confirmPassword'].touched ||
                form.controls['confirmPassword'].dirty)
            ) {
              <mat-error>Las contrasenas no coinciden</mat-error>
            }
          </mat-form-field>
        </div>

        <div class="form-section">
          <h3>Perfil</h3>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>
                <app-form-label
                  text="Nombre"
                  [required]="true"
                ></app-form-label>
              </mat-label>
              <input
                matInput
                formControlName="firstName"
                placeholder="Ingresa el nombre"
              />
              <mat-icon matPrefix>badge</mat-icon>
              <app-form-control-error
                [control]="form.controls['firstName']"
                [submitted]="submitted()"
              ></app-form-control-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>
                <app-form-label
                  text="Apellido"
                  [required]="true"
                ></app-form-label>
              </mat-label>
              <input
                matInput
                formControlName="lastName"
                placeholder="Ingresa el apellido"
              />
              <app-form-control-error
                [control]="form.controls['lastName']"
                [submitted]="submitted()"
              ></app-form-control-error>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Telefono</mat-label>
            <input
              matInput
              formControlName="phone"
              placeholder="Ingresa el telefono si aplica"
            />
            <mat-icon matPrefix>phone</mat-icon>
          </mat-form-field>
        </div>

        <div class="form-section">
          <h3>Roles</h3>

          @if (loadingRoles()) {
            <div class="loading-inline">
              <mat-spinner diameter="20"></mat-spinner>
              <span>Cargando roles...</span>
            </div>
          } @else {
            <mat-form-field appearance="outline">
              <mat-label>Roles iniciales</mat-label>
              <mat-select formControlName="roles" multiple>
                @for (role of availableRoles(); track role) {
                  <mat-option [value]="role">{{ role }}</mat-option>
                }
              </mat-select>
              <mat-icon matPrefix>shield</mat-icon>
              <mat-hint>Opcional</mat-hint>
            </mat-form-field>
          }
        </div>

        <div class="form-section options">
          <mat-checkbox formControlName="sendWelcomeEmail">
            Enviar email de bienvenida
          </mat-checkbox>
        </div>
      </form>

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
        [disabled]="saving()"
      >
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <ng-container>
            <mat-icon>person_add</mat-icon>
            Crear usuario
          </ng-container>
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 400px;
        max-width: 520px;
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
        display: inline-flex;
        align-items: center;
        gap: 8px;

        mat-spinner {
          display: inline-block;
        }
      }

      @media (max-width: 640px) {
        .form-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
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
