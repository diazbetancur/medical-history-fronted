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
  templateUrl: './cancel-appointment-dialog.component.html',
  styleUrl: './cancel-appointment-dialog.component.scss',
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
          this.dialogRef.close(true);
        },
        error: () => {
          this.cancelling.set(false);
          this.dialogRef.close(false);
        },
      });
  }
}
