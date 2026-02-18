import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ThemePalette } from '@angular/material/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: ThemePalette;
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>

    <mat-dialog-content>
      <div class="content-row">
        @if (data.icon) {
          <mat-icon class="dialog-icon">{{ data.icon }}</mat-icon>
        }
        <p>{{ data.message }}</p>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close(false)">
        {{ data.cancelText || 'Cancelar' }}
      </button>
      <button
        mat-flat-button
        [color]="data.confirmColor || 'warn'"
        (click)="close(true)"
      >
        {{ data.confirmText || 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .content-row {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .dialog-icon {
        margin-top: 2px;
        color: var(--color-warning);
      }

      p {
        margin: 0;
        color: var(--color-text-primary);
        line-height: 1.5;
        white-space: pre-line;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  close(result: boolean): void {
    this.dialogRef.close(result);
  }
}
