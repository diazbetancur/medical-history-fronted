import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RolesStore } from '@data/stores/roles.store';

@Component({
  selector: 'app-create-role-dialog',
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
  templateUrl: './create-role-dialog.component.html',
  styleUrl: './create-role-dialog.component.scss',
})
export class CreateRoleDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CreateRoleDialogComponent>);
  private readonly rolesStore = inject(RolesStore);

  roleName = '';
  roleDescription = '';

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  onCreate(): void {
    if (!this.roleName.trim()) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    this.rolesStore
      .createRole({
        name: this.roleName.trim(),
        description: this.roleDescription.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.dialogRef.close({ success: true });
        },
        error: (err) => {
          const errorMessage =
            err.status === 403
              ? 'No tienes permisos para crear roles'
              : err.error?.message || 'Error al crear rol';

          this.error.set(errorMessage);
          this.saving.set(false);
        },
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}