import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { FormControlErrorComponent, FormLabelComponent } from '@shared/ui/forms';

export interface EditDependentNameDialogData {
  currentName: string;
}

@Component({
  selector: 'app-edit-dependent-name-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    FormLabelComponent,
    FormControlErrorComponent,
  ],
  templateUrl: './edit-dependent-name-dialog.component.html',
  styleUrl: './edit-dependent-name-dialog.component.scss',
})
export class EditDependentNameDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<EditDependentNameDialogComponent>);
  readonly data = inject<EditDependentNameDialogData>(MAT_DIALOG_DATA);

  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    fullName: [this.data.currentName, [Validators.required, Validators.maxLength(200)]],
  });

  readonly messages = {
    fullName: {
      required: 'Ingresa el nombre completo',
      maxlength: 'Máximo 200 caracteres',
    },
  };

  submit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue().fullName.trim());
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
