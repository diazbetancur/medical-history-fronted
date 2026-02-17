import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AppointmentsApi } from '@data/api';

/**
 * Cancel Appointment Dialog Component
 *
 * Dialog for cancelling an appointment with optional reason.
 *
 * Data: { appointmentId: string }
 * Returns: boolean (true if cancelled successfully)
 */
@Component({
  selector: 'app-cancel-appointment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Cancelar Cita</h2>

    <mat-dialog-content>
      <p>¿Estás seguro que deseas cancelar esta cita?</p>

      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Motivo de cancelación (opcional)</mat-label>
          <textarea
            matInput
            formControlName="reason"
            rows="3"
            placeholder="Ej: Conflicto de horario"
            maxlength="200"
          ></textarea>
          <mat-hint align="end"
            >{{ form.value.reason?.length || 0 }}/200</mat-hint
          >
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false" [disabled]="cancelling()">
        No, volver
      </button>
      <button
        mat-raised-button
        color="warn"
        (click)="confirmCancel()"
        [disabled]="cancelling()"
      >
        @if (cancelling()) {
          <mat-spinner diameter="20"></mat-spinner>
          Cancelando...
        } @else {
          Sí, cancelar cita
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .full-width {
        width: 100%;
      }

      mat-dialog-content {
        min-width: 350px;

        p {
          margin-bottom: 16px;
        }
      }

      mat-spinner {
        display: inline-block;
        margin-right: 8px;
      }
    `,
  ],
})
export class CancelAppointmentDialogComponent {
  private readonly appointmentsApi = inject(AppointmentsApi);
  private readonly dialogRef = inject(
    MatDialogRef<CancelAppointmentDialogComponent>,
  );
  private readonly data = inject<{ appointmentId: string }>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  readonly cancelling = signal(false);
  readonly form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      reason: ['', Validators.maxLength(200)],
    });
  }

  confirmCancel(): void {
    this.cancelling.set(true);

    this.appointmentsApi
      .cancelAppointment({
        appointmentId: this.data.appointmentId,
        reason: this.form.value.reason || undefined,
      })
      .subscribe({
        next: () => {
          this.cancelling.set(false);
          this.dialogRef.close(true); // Return true = cancelled
        },
        error: () => {
          // Error handled by interceptor (toast shown)
          this.cancelling.set(false);
          this.dialogRef.close(false); // Return false = failed
        },
      });
  }
}
