import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
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
  template: `
    <h2 mat-dialog-title>
      <mat-icon>edit</mat-icon>
      Editar Rol
    </h2>

    <mat-dialog-content>
      <form #roleForm="ngForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre del Rol</mat-label>
          <input
            matInput
            [(ngModel)]="roleName"
            name="roleName"
            required
            placeholder="Ej: Editor de Contenido"
            [disabled]="saving() || isSystemRole"
          />
          <mat-icon matPrefix>badge</mat-icon>
          @if (isSystemRole) {
            <mat-hint>
              Los roles del sistema no pueden cambiar su nombre
            </mat-hint>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción</mat-label>
          <textarea
            matInput
            [(ngModel)]="roleDescription"
            name="roleDescription"
            rows="3"
            placeholder="Describe las responsabilidades de este rol"
            [disabled]="saving()"
          ></textarea>
          <mat-icon matPrefix>description</mat-icon>
        </mat-form-field>
      </form>

      @if (error()) {
        <div class="error-message">
          <mat-icon>error</mat-icon>
          <span>{{ error() }}</span>
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
        (click)="onUpdate()"
        [disabled]="!hasChanges() || saving()"
      >
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
        }
        @if (!saving()) {
          <mat-icon>save</mat-icon>
        }
        Guardar Cambios
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      padding: 20px 24px;
      border-bottom: 1px solid var(--mat-app-outline-variant);

      mat-icon {
        color: var(--mat-app-primary);
      }
    }

    mat-dialog-content {
      padding: 24px;
      min-width: 400px;
      max-width: 500px;

      form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .full-width {
        width: 100%;
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--mat-app-error-container);
      color: var(--mat-app-on-error-container);
      border-radius: 8px;
      margin-top: 16px;

      mat-icon {
        color: var(--mat-app-error);
      }
    }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid var(--mat-app-outline-variant);
      gap: 8px;

      button {
        display: flex;
        align-items: center;
        gap: 8px;

        mat-spinner {
          display: inline-block;
        }
      }
    }
  `,
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

  hasChanges(): boolean {
    const nameChanged =
      !this.isSystemRole && this.roleName.trim() !== this.originalName;

    return (
      nameChanged || this.roleDescription.trim() !== this.originalDescription
    );
  }

  onUpdate() {
    if (!this.hasChanges()) return;

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

  onCancel() {
    this.dialogRef.close();
  }
}
