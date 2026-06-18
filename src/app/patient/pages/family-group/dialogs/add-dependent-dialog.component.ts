import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormControlErrorComponent, FormLabelComponent } from '@shared/ui/forms';
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
    MatIconModule,
    FormLabelComponent,
    FormControlErrorComponent,
  ],
  templateUrl: './add-dependent-dialog.component.html',
  styleUrl: './add-dependent-dialog.component.scss',
})
export class AddDependentDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddDependentDialogComponent>);

  // Tipos de documento de Honduras (homogéneo con el resto de formularios:
  // paciente externo del profesional, perfil del paciente, etc.).
  readonly documentTypes = ['DNI', 'Pasaporte', 'RNP'];

  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    documentType: ['DNI', [Validators.required]],
    documentNumber: ['', [Validators.required, Validators.maxLength(30)]],
    fullName: ['', [Validators.required, Validators.maxLength(200)]],
  });

  readonly messages = {
    documentType: { required: 'Selecciona el tipo de documento' },
    documentNumber: {
      required: 'Ingresa el número de documento',
      maxlength: 'Máximo 30 caracteres',
    },
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
