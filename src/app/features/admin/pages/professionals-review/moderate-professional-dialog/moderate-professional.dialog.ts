import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import type { AdminProfessionalListItem } from '@data/api/api-models';
import { AdminProfessionalsStore } from '@data/stores/admin-professionals.store';

export interface ModerateProfessionalDialogData {
  professional: AdminProfessionalListItem;
  action: 'verify' | 'disable';
}

export interface ModerateProfessionalDialogResult {
  success: boolean;
}

@Component({
  selector: 'app-moderate-professional-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './moderate-professional.dialog.html',
  styleUrl: './moderate-professional.dialog.scss',
})
export class ModerateProfessionalDialogComponent {
  readonly data = inject<ModerateProfessionalDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<
      MatDialogRef<
        ModerateProfessionalDialogComponent,
        ModerateProfessionalDialogResult
      >
    >(MatDialogRef);
  readonly store = inject(AdminProfessionalsStore);

  readonly isVerify = this.data.action === 'verify';
  adminNotes = '';
  isFeatured = false;
  readonly error = signal<string | null>(null);

  confirm(): void {
    this.error.set(null);
    const notes = this.adminNotes.trim() || undefined;
    const id = this.data.professional.id;

    const action$ = this.isVerify
      ? this.store.verifyProfessional(id, notes, this.isFeatured)
      : this.store.disableProfessional(id, notes);

    action$.subscribe({
      next: () => this.dialogRef.close({ success: true }),
      error: (err) => {
        const msg =
          err?.error?.detail ??
          (this.isVerify
            ? 'No se pudo verificar el profesional'
            : 'No se pudo desactivar el profesional');
        this.error.set(msg);
      },
    });
  }
}
