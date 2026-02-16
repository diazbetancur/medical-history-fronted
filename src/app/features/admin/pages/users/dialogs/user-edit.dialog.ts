import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type {
  AdminUserDetailDto,
  AdminUserListDto,
  UpdateUserDto,
} from '@data/api/admin-users.types';
import { AdminUsersStore } from '@data/stores/admin-users.store';

export interface UserEditDialogData {
  user: AdminUserListDto | AdminUserDetailDto;
}

@Component({
  selector: 'app-user-edit-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>edit</mat-icon>
      Editar Usuario
    </h2>

    <mat-dialog-content>
      <!-- User Header -->
      <div class="user-header">
        <mat-icon class="avatar">account_circle</mat-icon>
        <div class="user-info">
          <strong>{{ data.user.userName }}</strong>
          <span class="email">{{ data.user.email }}</span>
        </div>
      </div>

      <form [formGroup]="form" class="edit-form">
        <!-- Profile Section -->
        <div class="form-section">
          <h3>Información del Perfil</h3>

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
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" />
            <mat-icon matPrefix>email</mat-icon>
            @if (form.get('email')?.hasError('email')) {
              <mat-error>Formato de email inválido</mat-error>
            }
          </mat-form-field>

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

        <!-- Account Status Section -->
        <div class="form-section">
          <h3>Estado de la Cuenta</h3>

          <div class="toggle-row">
            <mat-slide-toggle formControlName="isLockedOut" color="warn">
              Cuenta bloqueada
            </mat-slide-toggle>
            <span class="toggle-hint">
              @if (form.get('isLockedOut')?.value) {
                El usuario no podrá iniciar sesión
              } @else {
                El usuario puede iniciar sesión normalmente
              }
            </span>
          </div>
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
        [disabled]="saving() || !hasChanges()"
      >
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <ng-container>
            <mat-icon>save</mat-icon>
            Guardar Cambios
          </ng-container>
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

      .user-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: var(--mat-app-surface-container);
        border-radius: 12px;
        margin-bottom: 24px;

        .avatar {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: var(--mat-app-primary);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 4px;

          strong {
            font-size: 16px;
          }

          .email {
            font-size: 14px;
            color: var(--mat-app-on-surface-variant);
          }
        }
      }

      .edit-form {
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
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .toggle-row {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 16px;
        background: var(--mat-app-surface-container);
        border-radius: 8px;

        .toggle-hint {
          font-size: 12px;
          color: var(--mat-app-on-surface-variant);
        }
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
export class UserEditDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<UserEditDialogComponent>);
  readonly data = inject<UserEditDialogData>(MAT_DIALOG_DATA);
  private readonly store = inject(AdminUsersStore);
  private readonly fb = inject(FormBuilder);

  // State
  readonly saving = this.store.saving;
  readonly errorMessage = signal<string | null>(null);

  // Original values for change detection
  private originalValues: Record<string, unknown> = {};

  // Form
  readonly form: FormGroup = this.fb.group({
    firstName: [''],
    lastName: [''],
    email: ['', [Validators.email]],
    phone: [''],
    isLockedOut: [false],
  });

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    const user = this.data.user;
    const profile = 'profile' in user ? user.profile : undefined;

    const initialValues = {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: user.email || '',
      phone: (profile as { phone?: string })?.phone || '',
      isLockedOut: user.isLockedOut || false,
    };

    this.form.patchValue(initialValues);
    this.originalValues = { ...initialValues };
  }

  hasChanges(): boolean {
    const current = this.form.value;
    return Object.keys(this.originalValues).some(
      (key) => current[key] !== this.originalValues[key],
    );
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.form.invalid || !this.hasChanges()) {
      return;
    }

    this.errorMessage.set(null);

    const formValue = this.form.value;
    const dto: UpdateUserDto = {};

    // Only include changed fields
    if (formValue.email !== this.originalValues['email']) {
      dto.email = formValue.email;
    }

    if (formValue.isLockedOut !== this.originalValues['isLockedOut']) {
      dto.isLockedOut = formValue.isLockedOut;
    }

    // Profile changes
    const hasProfileChanges =
      formValue.firstName !== this.originalValues['firstName'] ||
      formValue.lastName !== this.originalValues['lastName'] ||
      formValue.phone !== this.originalValues['phone'];

    if (hasProfileChanges) {
      dto.profile = {
        firstName: formValue.firstName || undefined,
        lastName: formValue.lastName || undefined,
        phone: formValue.phone || undefined,
      };
    }

    this.store.updateUser(this.data.user.id, dto);

    // Watch for completion
    const checkComplete = setInterval(() => {
      if (!this.saving()) {
        clearInterval(checkComplete);
        const error = this.store.error();
        if (error) {
          this.errorMessage.set(
            error.message || 'Error al actualizar el usuario',
          );
        } else {
          this.dialogRef.close({ success: true });
        }
      }
    }, 100);

    // Timeout safety
    setTimeout(() => clearInterval(checkComplete), 30000);
  }
}
