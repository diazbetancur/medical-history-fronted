import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AddMemberByDocumentRequest } from '../../../services/family-group.models';

@Component({
  selector: 'app-add-dependent-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './add-dependent-dialog.component.html',
})
export class AddDependentDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddDependentDialogComponent>);

  readonly documentTypes = ['CC', 'TI', 'CE', 'PA', 'RC'];

  readonly form = this.fb.nonNullable.group({
    documentType: ['CC', [Validators.required]],
    documentNumber: ['', [Validators.required, Validators.maxLength(30)]],
    fullName: ['', [Validators.required, Validators.maxLength(200)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload: AddMemberByDocumentRequest = {
      documentType: value.documentType,
      documentNumber: value.documentNumber.trim(),
      fullName: value.fullName.trim(),
    };
    this.dialogRef.close(payload);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
