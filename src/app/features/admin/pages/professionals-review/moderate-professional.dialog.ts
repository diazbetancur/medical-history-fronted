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

// ─────────────────────────────────────────────────────────────────────────────

export interface ModerateProfessionalDialogData {
  professional: AdminProfessionalListItem;
  action: 'verify' | 'disable';
}

export interface ModerateProfessionalDialogResult {
  success: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────

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
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ isVerify ? 'verified' : 'block' }}</mat-icon>
      {{ isVerify ? 'Verificar Profesional' : 'Desactivar Profesional' }}
    </h2>

    <mat-dialog-content>
      <p class="dialog-description">
        @if (isVerify) {
          ¿Confirmas que deseas <strong>verificar</strong> el perfil de
          <strong>{{ data.professional.businessName }}</strong
          >? El profesional podrá ser encontrado por los pacientes en la
          plataforma.
        } @else {
          ¿Confirmas que deseas <strong>desactivar</strong> el perfil de
          <strong>{{ data.professional.businessName }}</strong
          >? El perfil dejará de ser visible para los pacientes.
        }
      </p>

      <mat-form-field appearance="outline" class="notes-field">
        <mat-label>
          {{
            isVerify ? 'Notas (opcional)' : 'Motivo de desactivación (opcional)'
          }}
        </mat-label>
        <textarea
          matInput
          [(ngModel)]="adminNotes"
          rows="3"
          [placeholder]="
            isVerify
              ? 'Ej: Documentación verificada correctamente'
              : 'Ej: Incumplimiento de términos de servicio'
          "
        ></textarea>
        <mat-hint
          >Estas notas son internas y no serán visibles para el
          usuario.</mat-hint
        >
      </mat-form-field>

      @if (isVerify) {
        <mat-checkbox [(ngModel)]="isFeatured" [disabled]="store.saving()">
          Marcar como profesional destacado
        </mat-checkbox>
      }

      @if (error()) {
        <p class="dialog-error">
          <mat-icon>error</mat-icon>
          {{ error() }}
        </p>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close [disabled]="store.saving()">
        Cancelar
      </button>
      <button
        mat-raised-button
        [color]="isVerify ? 'primary' : 'warn'"
        (click)="confirm()"
        [disabled]="store.saving()"
      >
        @if (store.saving()) {
          <mat-progress-spinner
            mode="indeterminate"
            diameter="20"
            strokeWidth="2"
          ></mat-progress-spinner>
        } @else {
          <mat-icon>{{ isVerify ? 'verified' : 'block' }}</mat-icon>
        }
        {{ isVerify ? 'Verificar' : 'Desactivar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      h2[mat-dialog-title] {
        display: flex;
        align-items: center;
        gap: 10px;
        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }

      mat-dialog-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-top: 8px;
      }

      .dialog-description {
        margin: 0;
        font-size: 15px;
        line-height: 1.6;
        color: var(--mat-app-on-surface-variant);
      }

      .notes-field {
        width: 100%;
      }

      .dialog-error {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--mat-app-error);
        margin: 0;
        font-size: 14px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      mat-dialog-actions {
        gap: 12px;
        padding: 16px 24px;

        button {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
    `,
  ],
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
