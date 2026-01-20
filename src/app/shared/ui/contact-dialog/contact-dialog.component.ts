import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { RequestFormStore } from '@data/stores';
import { AnalyticsService } from '@shared/services';

export interface ContactDialogData {
  professionalId: string;
  professionalName: string;
  professionalSlug: string;
  services?: Array<{ id: string; name: string }>;
}

@Component({
  selector: 'app-contact-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './contact-dialog.component.html',
  styleUrl: './contact-dialog.component.scss',
})
export class ContactDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ContactDialogComponent>);
  readonly data = inject<ContactDialogData>(MAT_DIALOG_DATA);
  private readonly formStore = inject(RequestFormStore);
  private readonly analytics = inject(AnalyticsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);

  // Store signals
  readonly loading = this.formStore.loading;
  readonly success = this.formStore.success;
  readonly error = this.formStore.error;

  // Form
  readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    serviceId: [null],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  constructor() {
    // Reset store on dialog open
    this.formStore.reset();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const selectedService = this.data.services?.find(
      (s) => s.id === formValue.serviceId
    );

    this.formStore
      .submit({
        profileId: this.data.professionalId,
        serviceId: formValue.serviceId || undefined,
        clientName: formValue.name,
        clientEmail: formValue.email,
        clientPhone: formValue.phone || undefined,
        message: formValue.message,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // Track analytics event
          this.analytics.trackEvent('submit_request', {
            professionalId: this.data.professionalId,
            professionalSlug: this.data.professionalSlug,
            serviceName: selectedService?.name,
            requestId: response.id,
          });
        },
        error: () => {
          // Error is handled by store
        },
      });
  }

  close(): void {
    this.dialogRef.close(true);
  }
}
