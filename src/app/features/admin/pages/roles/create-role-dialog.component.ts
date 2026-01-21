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
  template: `
    <h2 mat-dialog-title>
      <mat-icon>add_circle</mat-icon>
      Crear Nuevo Rol
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
            [disabled]="saving()"
          />
          <mat-icon matPrefix>badge</mat-icon>
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
        (click)="onCreate()"
        [disabled]="!roleName.trim() || saving()"
      >
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
        }
        @if (!saving()) {
          <mat-icon>save</mat-icon>
        }
        Crear Rol
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
export class CreateRoleDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<CreateRoleDialogComponent>);
  private readonly rolesStore = inject(RolesStore);

  roleName = '';
  roleDescription = '';

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  onCreate() {
    if (!this.roleName.trim()) return;

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

  onCancel() {
    this.dialogRef.close();
  }
}
