import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ThemePalette } from '@angular/material/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface ConfirmReasonDialogData {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: ThemePalette;
  icon?: string;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonDefault?: string;
  reasonRequired?: boolean;
}

export interface ConfirmReasonDialogResult {
  reason: string | null;
}

@Component({
  selector: 'app-confirm-reason-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './confirm-reason-dialog.component.html',
  styleUrl: './confirm-reason-dialog.component.scss',
})
export class ConfirmReasonDialogComponent {
  private readonly dialogRef =
    inject(MatDialogRef<ConfirmReasonDialogComponent>);
  readonly data = inject<ConfirmReasonDialogData>(MAT_DIALOG_DATA);

  reason = this.data.reasonDefault ?? '';

  confirm(): void {
    const trimmed = this.reason.trim();
    this.dialogRef.close({
      reason: trimmed || null,
    } satisfies ConfirmReasonDialogResult);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  get canConfirm(): boolean {
    return !this.data.reasonRequired || this.reason.trim().length > 0;
  }
}
