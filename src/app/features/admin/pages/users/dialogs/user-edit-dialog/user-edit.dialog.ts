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
  templateUrl: './user-edit.dialog.html',
  styleUrl: './user-edit.dialog.scss',
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

    const initialValues = {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: ('phoneNumber' in user ? (user as { phoneNumber?: string }).phoneNumber : '') || '',
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

    if (formValue.firstName !== this.originalValues['firstName']) {
      dto.firstName = formValue.firstName || undefined;
    }
    if (formValue.lastName !== this.originalValues['lastName']) {
      dto.lastName = formValue.lastName || undefined;
    }
    if (formValue.phone !== this.originalValues['phone']) {
      dto.phoneNumber = formValue.phone || undefined;
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
