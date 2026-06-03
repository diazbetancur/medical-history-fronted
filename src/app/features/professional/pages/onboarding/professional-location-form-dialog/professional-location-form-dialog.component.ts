import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
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
import { MatSelectModule } from '@angular/material/select';
import { City, Department } from '@data/api/api-models';
import { GeographyMetadataService } from '../../../../../public/services';
import { take } from 'rxjs';

export interface ProfessionalLocationFormDialogData {
  title: string;
  submitLabel: string;
  initial?: {
    name: string;
    address: string;
    phone: string;
    cityId: string;
    cityName: string;
    countryId: string;
    countryName: string;
  };
}

export interface ProfessionalLocationFormDialogResult {
  name: string;
  address?: string;
  cityId?: string;
  cityName?: string;
  countryId?: string;
  countryName?: string;
  phone?: string;
}

@Component({
  selector: 'app-professional-location-form-dialog',
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
  ],
  templateUrl: './professional-location-form-dialog.component.html',
  styleUrl: './professional-location-form-dialog.component.scss',
})
export class ProfessionalLocationFormDialogComponent implements OnInit {
  readonly data = inject<ProfessionalLocationFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(
    MatDialogRef<ProfessionalLocationFormDialogComponent>,
  );
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly geographyMetadataService = inject(GeographyMetadataService);

  readonly departments = signal<Department[]>([]);
  readonly cities = signal<City[]>([]);
  readonly isLoadingGeography = signal(false);
  readonly isLoadingCities = signal(false);
  readonly geographyError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: [
      this.data.initial?.name ?? '',
      [
        Validators.required,
        Validators.maxLength(200),
        this.requiredTrimmedValidator(),
      ],
    ],
    address: [this.data.initial?.address ?? '', [Validators.maxLength(300)]],
    departmentId: [''],
    cityId: [this.data.initial?.cityId ?? ''],
    phone: [
      this.data.initial?.phone ?? '',
      [Validators.maxLength(30), this.phoneValidator()],
    ],
  });

  ngOnInit(): void {
    this.restoreInitialCityOption();

    this.form.controls.departmentId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((departmentId) => {
        if (!departmentId) {
          this.restoreInitialCityOption();
          return;
        }

        this.loadCitiesByDepartment(departmentId);
      });

    this.loadDepartments();
  }

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const selectedCity = this.cities().find((city) => city.id === value.cityId);

    this.dialogRef.close({
      name: value.name.trim(),
      address: value.address.trim() || undefined,
      cityId: value.cityId || undefined,
      cityName: selectedCity?.name || this.data.initial?.cityName || undefined,
      countryId: value.cityId
        ? selectedCity?.countryId || this.data.initial?.countryId || undefined
        : undefined,
      countryName:
        selectedCity?.countryName ||
        this.data.initial?.countryName ||
        'Honduras',
      phone: value.phone.trim() || undefined,
    } satisfies ProfessionalLocationFormDialogResult);
  }

  private loadDepartments(): void {
    this.isLoadingGeography.set(true);
    this.geographyError.set(null);

    this.geographyMetadataService
      .loadHondurasGeographyIfNeeded()
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.departments.set(
            this.geographyMetadataService.getHondurasDepartments(),
          );
          this.isLoadingGeography.set(false);
        },
        error: () => {
          this.geographyError.set(
            'No fue posible cargar los departamentos de Honduras.',
          );
          this.isLoadingGeography.set(false);
        },
      });
  }

  private loadCitiesByDepartment(departmentId: string): void {
    const selectedCityId = this.form.controls.cityId.value;

    this.isLoadingCities.set(true);
    this.geographyError.set(null);

    this.geographyMetadataService
      .getCitiesByDepartment(departmentId)
      .pipe(take(1))
      .subscribe({
        next: (cities) => {
          this.cities.set(cities);

          if (!cities.some((city) => city.id === selectedCityId)) {
            this.form.controls.cityId.setValue('', { emitEvent: false });
          }

          this.isLoadingCities.set(false);
        },
        error: () => {
          this.cities.set([]);
          this.form.controls.cityId.setValue('', { emitEvent: false });
          this.geographyError.set(
            'No fue posible cargar las ciudades del departamento seleccionado.',
          );
          this.isLoadingCities.set(false);
        },
      });
  }

  private restoreInitialCityOption(): void {
    const initialCity = this.buildInitialCityOption();

    if (!initialCity) {
      this.cities.set([]);
      this.form.controls.cityId.setValue('', { emitEvent: false });
      return;
    }

    this.cities.set([initialCity]);
    this.form.controls.cityId.setValue(initialCity.id, { emitEvent: false });
  }

  private buildInitialCityOption(): City | null {
    const cityId = this.data.initial?.cityId?.trim();
    const cityName = this.data.initial?.cityName?.trim();

    if (!cityId || !cityName) {
      return null;
    }

    return {
      id: cityId,
      name: cityName,
      slug: this.slugify(cityName),
      countryId: this.data.initial?.countryId ?? '',
    };
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/^-+|-+$/g, '');
  }

  private requiredTrimmedValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return control.value?.trim() ? null : { requiredTrimmed: true };
    };
  }

  private phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const hasDigits = /\d/.test(value);
      const validChars = /^[0-9+\-() ]+$/.test(value);

      if (!hasDigits || !validChars) {
        return { invalidPhone: true };
      }

      return null;
    };
  }
}
