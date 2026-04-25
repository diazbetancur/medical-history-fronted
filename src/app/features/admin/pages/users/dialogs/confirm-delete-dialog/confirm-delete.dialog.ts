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
  templateUrl: './confirm-delete.dialog.html',
  styleUrl: './confirm-delete.dialog.scss',
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
