import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { AdminUserListDto } from '@data/api/admin-users.types';
import { AdminUsersStore } from '@data/stores/admin-users.store';

export interface ConfirmDeleteDialogData {
  user: AdminUserListDto;
}

@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title class="warn-title">
      <mat-icon>warning</mat-icon>
      Confirmar Eliminación
    </h2>

    <mat-dialog-content>
      <div class="warning-content">
        <div class="user-to-delete">
          <mat-icon class="avatar">account_circle</mat-icon>
          <div class="user-info">
            <strong>{{ data.user.userName }}</strong>
            <span class="email">{{ data.user.email }}</span>
          </div>
        </div>

        <div class="warning-message">
          <p>
            <strong>¿Estás seguro de que deseas eliminar este usuario?</strong>
          </p>
          <p>Esta acción no se puede deshacer. Se eliminarán:</p>
          <ul>
            <li>Todos los datos del perfil</li>
            <li>Historial de accesos</li>
            <li>Configuraciones asociadas</li>
          </ul>
        </div>
      </div>

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
        color="warn"
        (click)="onConfirm()"
        [disabled]="saving()"
      >
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <ng-container>
            <mat-icon>delete_forever</mat-icon>
            Eliminar Usuario
          </ng-container>
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 350px;
        max-width: 450px;
      }

      .warn-title {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--mat-app-error);

        mat-icon {
          color: var(--mat-app-error);
        }
      }

      .warning-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .user-to-delete {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        background: var(--mat-app-error-container);
        border-radius: 12px;

        .avatar {
          font-size: 48px;
          width: 48px;
          height: 48px;
          color: var(--mat-app-on-error-container);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 4px;

          strong {
            font-size: 16px;
            color: var(--mat-app-on-error-container);
          }

          .email {
            font-size: 14px;
            color: var(--mat-app-on-error-container);
            opacity: 0.8;
          }
        }
      }

      .warning-message {
        padding: 0 8px;

        p {
          margin: 0 0 12px 0;
          font-size: 14px;
          line-height: 1.5;

          strong {
            color: var(--mat-app-error);
          }
        }

        ul {
          margin: 0;
          padding-left: 20px;

          li {
            font-size: 14px;
            color: var(--mat-app-on-surface-variant);
            margin-bottom: 4px;
          }
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

      mat-dialog-actions {
        padding-top: 16px;

        button {
          mat-spinner {
            display: inline-block;
            margin-right: 8px;
          }
        }
      }
    `,
  ],
})
export class ConfirmDeleteDialogComponent {
  private readonly dialogRef = inject(
    MatDialogRef<ConfirmDeleteDialogComponent>,
  );
  readonly data = inject<ConfirmDeleteDialogData>(MAT_DIALOG_DATA);
  private readonly store = inject(AdminUsersStore);

  // State
  readonly saving = this.store.saving;
  readonly errorMessage = signal<string | null>(null);

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.errorMessage.set(null);

    this.store.deleteUser(this.data.user.id);

    // Watch for completion
    const checkComplete = setInterval(() => {
      if (!this.saving()) {
        clearInterval(checkComplete);
        const error = this.store.error();
        if (error) {
          this.errorMessage.set(
            error.message || 'Error al eliminar el usuario',
          );
        } else {
          this.dialogRef.close({ success: true, deleted: true });
        }
      }
    }, 100);

    // Timeout safety
    setTimeout(() => clearInterval(checkComplete), 30000);
  }
}
