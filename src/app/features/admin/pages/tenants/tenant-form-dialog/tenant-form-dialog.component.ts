import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type {
  CreateTenantDto,
  TenantDto,
  UpdateTenantDto,
} from '@data/models/tenant.models';
import {
  FormControlErrorComponent,
  FormLabelComponent,
} from '@shared/ui/forms';

export interface TenantFormDialogData {
  mode: 'create' | 'edit';
  tenant?: TenantDto;
}

@Component({
  selector: 'app-tenant-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule,
    FormLabelComponent,
    FormControlErrorComponent,
  ],
  templateUrl: './tenant-form-dialog.component.html',
  styleUrl: './tenant-form-dialog.component.scss',
})
export class TenantFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TenantFormDialogComponent>);
  readonly data = inject<TenantFormDialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;
  readonly submitted = signal(false);

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      code: [
        { value: this.data.tenant?.code ?? '', disabled: this.isEditMode },
        [Validators.required, Validators.maxLength(40)],
      ],
      name: [
        this.data.tenant?.name ?? '',
        [Validators.required, Validators.maxLength(150)],
      ],
      isActive: [this.data.tenant?.isActive ?? true],
    });
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    if (this.isEditMode) {
      const dto: UpdateTenantDto = {
        name: formValue.name?.trim() || '',
        isActive: !!formValue.isActive,
      };
      this.dialogRef.close(dto);
    } else {
      const dto: CreateTenantDto = {
        code: formValue.code?.trim() || '',
        name: formValue.name?.trim() || '',
      };
      this.dialogRef.close(dto);
    }
  }
}
