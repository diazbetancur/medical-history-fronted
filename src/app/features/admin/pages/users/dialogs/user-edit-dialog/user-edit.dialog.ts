import { Component, computed, inject, OnInit, signal } from '@angular/core';
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
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type {
  AdminUserDetailDto,
  AdminUserListDto,
  UpdateUserDto,
} from '@data/api/admin-users.types';
import { TenantsApi } from '@data/api/tenants.api';
import { AdminUsersStore } from '@data/stores/admin-users.store';
import { TenantsStore } from '@data/stores/tenants.store';
import { AuthStore } from '@core/auth';
import { ToastService } from '@shared/services';

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
    MatSelectModule,
  ],
  templateUrl: './user-edit.dialog.html',
  styleUrl: './user-edit.dialog.scss',
})
export class UserEditDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<UserEditDialogComponent>);
  readonly data = inject<UserEditDialogData>(MAT_DIALOG_DATA);
  private readonly store = inject(AdminUsersStore);
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  readonly tenantsStore = inject(TenantsStore);
  private readonly tenantsApi = inject(TenantsApi);
  private readonly toastService = inject(ToastService);

  // State
  readonly saving = this.store.saving;
  readonly errorMessage = signal<string | null>(null);
  readonly savingTenant = signal(false);

  readonly isSuperAdmin = computed(() =>
    this.authStore.userRoles().some((r) => r.toUpperCase() === 'SUPERADMIN'),
  );

  // Original values for change detection
  private originalValues: Record<string, unknown> = {};
  private originalTenantId: string | null = null;

  // Form
  readonly form: FormGroup = this.fb.group({
    firstName: [''],
    lastName: [''],
    email: ['', [Validators.email]],
    phone: [''],
    isLockedOut: [false],
    tenantId: [null as string | null],
  });

  ngOnInit(): void {
    this.initializeForm();
    if (this.isSuperAdmin()) {
      this.tenantsStore.loadTenants();
    }
  }

  private initializeForm(): void {
    const user = this.data.user;
    const tenantId = user.tenantId ?? null;
    this.originalTenantId = tenantId;

    const initialValues = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: ('phoneNumber' in user ? (user as { phoneNumber?: string }).phoneNumber : '') || '',
      isLockedOut: user.isLockedOut || false,
      tenantId,
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
    if (formValue['email'] !== this.originalValues['email']) {
      dto.email = formValue['email'];
    }

    if (formValue['isLockedOut'] !== this.originalValues['isLockedOut']) {
      dto.isLockedOut = formValue['isLockedOut'];
    }

    if (formValue['firstName'] !== this.originalValues['firstName']) {
      dto.firstName = formValue['firstName'] || undefined;
    }
    if (formValue['lastName'] !== this.originalValues['lastName']) {
      dto.lastName = formValue['lastName'] || undefined;
    }
    if (formValue['phone'] !== this.originalValues['phone']) {
      dto.phoneNumber = formValue['phone'] || undefined;
    }

    const tenantChanged =
      this.isSuperAdmin() &&
      formValue['tenantId'] !== this.originalTenantId;

    // Check if there are non-tenant changes
    const hasNonTenantChanges = Object.keys(this.originalValues)
      .filter((k) => k !== 'tenantId')
      .some((key) => formValue[key] !== this.originalValues[key]);

    if (hasNonTenantChanges) {
      this.store.updateUser(this.data.user.id, dto);

      const checkComplete = setInterval(() => {
        if (!this.saving()) {
          clearInterval(checkComplete);
          const error = this.store.error();
          if (error) {
            this.errorMessage.set(
              error.message || 'Error al actualizar el usuario',
            );
          } else if (tenantChanged) {
            this.saveTenantAndClose();
          } else {
            this.dialogRef.close({ success: true });
          }
        }
      }, 100);

      setTimeout(() => clearInterval(checkComplete), 30000);
    } else if (tenantChanged) {
      this.saveTenantAndClose();
    }
  }

  private saveTenantAndClose(): void {
    const tenantId = this.form.value['tenantId'] as string | null;
    this.savingTenant.set(true);
    this.tenantsApi.assignUserTenant(this.data.user.id, tenantId).subscribe({
      next: () => {
        this.savingTenant.set(false);
        this.toastService.success('Tenant asignado correctamente');
        this.dialogRef.close({ success: true });
      },
      error: () => {
        this.savingTenant.set(false);
        this.toastService.error('No se pudo asignar el tenant');
        this.dialogRef.close({ success: true });
      },
    });
  }
}
