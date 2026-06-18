import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormLabelComponent } from '@shared/ui/forms';
import { BackgroundInput } from '../../../services/family-group.models';

@Component({
  selector: 'app-background-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    FormLabelComponent,
  ],
  templateUrl: './background-form-dialog.component.html',
})
export class BackgroundFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef =
    inject(MatDialogRef<BackgroundFormDialogComponent>);
  private readonly data = inject<BackgroundInput | null>(MAT_DIALOG_DATA, {
    optional: true,
  });

  readonly isEdit = !!this.data;

  readonly form = this.fb.nonNullable.group({
    type: [this.data?.type ?? '', [Validators.required, Validators.maxLength(120)]],
    title: [this.data?.title ?? '', [Validators.required, Validators.maxLength(200)]],
    description: [this.data?.description ?? '', [Validators.maxLength(1000)]],
    eventDate: [this.data?.eventDate ?? ''],
    isChronic: [this.data?.isChronic ?? false],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: BackgroundInput = {
      type: v.type.trim(),
      title: v.title.trim(),
      description: v.description.trim() || undefined,
      eventDate: v.eventDate || undefined,
      isChronic: v.isChronic,
    };
    this.dialogRef.close(payload);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
