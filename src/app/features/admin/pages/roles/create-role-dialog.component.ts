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
      Crear rol
    </h2>

    <mat-dialog-content>
      <form #roleForm="ngForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre del rol *</mat-label>
          <input
            matInput
            [(ngModel)]="roleName"
            name="roleName"
            #roleNameModel="ngModel"
            required
            placeholder="Ingresa el nombre del rol"
            [disabled]="saving()"
          />
          @if (roleNameModel.invalid && (roleForm.submitted || roleNameModel.touched)) {
            <mat-error>Este campo es obligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripcion</mat-label>
          <textarea
            matInput
            [(ngModel)]="roleDescription"
            name="roleDescription"
            rows="3"
            placeholder="Describe el objetivo del rol"
            [disabled]="saving()"
          ></textarea>
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
      <button mat-raised-button color="primary" (click)="onCreate()">
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <mat-icon>save</mat-icon>
        }
        Crear rol
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
        display: inline-flex;
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
