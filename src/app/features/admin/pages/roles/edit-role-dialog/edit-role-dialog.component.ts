import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { Role } from '@data/api/roles.api';
import { RolesStore } from '@data/stores/roles.store';

interface DialogData {
  role: Role;
}

@Component({
  selector: 'app-edit-role-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule,
  ],
  templateUrl: './edit-role-dialog.component.html',
  styleUrl: './edit-role-dialog.component.scss',
})
export class EditRoleDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<EditRoleDialogComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly rolesStore = inject(RolesStore);

  roleName: string;
  roleDescription: string;

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly isSystemRole: boolean;

  private originalName: string;
  private originalDescription: string;

  constructor() {
    this.isSystemRole = this.data.role.isSystem;
    this.roleName = this.data.role.name;
    this.roleDescription = this.data.role.description || '';
    this.originalName = this.data.role.name;
    this.originalDescription = this.data.role.description || '';
  }

  private hasChanges(): boolean {
    const nameChanged =
      !this.isSystemRole && this.roleName.trim() !== this.originalName;

    return (
      nameChanged || this.roleDescription.trim() !== this.originalDescription
    );
  }

  onUpdate(): void {
    if (!this.hasChanges()) {
      return;
    }

    if (!this.isSystemRole && !this.roleName.trim()) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const payload: { name?: string; description?: string } = {};

    if (!this.isSystemRole && this.roleName.trim() !== this.originalName) {
      payload.name = this.roleName.trim();
    }

    if (this.roleDescription.trim() !== this.originalDescription) {
      payload.description = this.roleDescription.trim();
    }

    this.rolesStore.updateRole(this.data.role.id, payload).subscribe({
      next: () => {
        this.dialogRef.close({ success: true });
      },
      error: (err) => {
        const errorMessage =
          err.status === 403
            ? 'No tienes permisos para editar roles'
            : err.error?.message || 'Error al actualizar rol';

        this.error.set(errorMessage);
        this.saving.set(false);
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
