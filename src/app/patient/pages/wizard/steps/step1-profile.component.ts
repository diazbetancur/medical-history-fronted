import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore } from '@core/auth';
import { ApiError, ApiErrorCode, getUserMessage } from '@core/http/api-error';
import { formatDateOnly } from '@core/http/http-utils';
import { ToastService } from '@core/ui/toast.service';
import {
  CreatePatientProfileDto,
  PatientProfileDto,
  UpdatePatientProfileDto,
} from '../../../models/patient-profile.dto';
import { PatientService } from '../../../services/patient.service';
import { WizardStore } from '../patient-wizard.page';

@Component({
  selector: 'app-step1-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  template: `
    <div class="step-container">
      <h2>Completa tu Perfil de Paciente</h2>
      <p class="subtitle">
        Necesitamos esta información para reservar tu cita médica
      </p>

      @if (isLoading()) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando perfil...</p>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Nombre</mat-label>
              <input
                matInput
                formControlName="firstName"
                placeholder="Ej: Juan"
              />
              @if (form.get('firstName')?.hasError('required')) {
                <mat-error>El nombre es requerido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Apellidos</mat-label>
              <input
                matInput
                formControlName="lastName"
                placeholder="Ej: García López"
              />
              @if (form.get('lastName')?.hasError('required')) {
                <mat-error>Los apellidos son requeridos</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Fecha de Nacimiento</mat-label>
              <input matInput type="date" formControlName="dateOfBirth" />
              @if (form.get('dateOfBirth')?.hasError('required')) {
                <mat-error>La fecha de nacimiento es requerida</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Teléfono</mat-label>
              <input
                matInput
                formControlName="phone"
                placeholder="Ej: +34 612 345 678"
              />
              @if (form.get('phone')?.hasError('required')) {
                <mat-error>El teléfono es requerido</mat-error>
              }
            </mat-form-field>
          </div>

          <h3>Dirección</h3>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Calle</mat-label>
            <input
              matInput
              formControlName="street"
              placeholder="Ej: Calle Mayor 10"
            />
            @if (form.get('street')?.hasError('required')) {
              <mat-error>La calle es requerida</mat-error>
            }
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Ciudad</mat-label>
              <input matInput formControlName="city" placeholder="Ej: Madrid" />
              @if (form.get('city')?.hasError('required')) {
                <mat-error>La ciudad es requerida</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>País</mat-label>
              <input
                matInput
                formControlName="country"
                placeholder="Ej: España"
              />
              @if (form.get('country')?.hasError('required')) {
                <mat-error>El país es requerido</mat-error>
              }
            </mat-form-field>
          </div>

          <div class="actions">
            <button
              mat-raised-button
              color="primary"
              type="submit"
              [disabled]="form.invalid || isSaving()"
            >
              @if (isSaving()) {
                <mat-spinner diameter="20"></mat-spinner>
              }
              {{ isCreateMode() ? 'Crear Perfil' : 'Actualizar Perfil' }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [
    `
      .step-container {
        padding: 24px;
        max-width: 800px;
        margin: 0 auto;
      }

      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 500;
      }

      .subtitle {
        margin: 0 0 24px 0;
        color: var(--color-text-secondary);
      }

      .loading {
        text-align: center;
        padding: 48px;

        p {
          margin-top: 16px;
        }
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      h3 {
        margin: 16px 0 8px 0;
        font-size: 18px;
        font-weight: 500;
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .full-width {
        width: 100%;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 16px;
        margin-top: 24px;

        button {
          min-width: 150px;
        }
      }

      @media (max-width: 768px) {
        .form-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class Step1ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly patientService = inject(PatientService);
  private readonly toast = inject(ToastService);
  private readonly authStore = inject(AuthStore);

  // Inputs/Outputs
  readonly wizardStore = input.required<WizardStore>();
  readonly completed = output<void>();

  // State
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isCreateMode = signal(false);
  readonly hasAutoAdvanced = signal(false);

  // Form
  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadProfile();
  }

  private initForm(): void {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      phone: ['', Validators.required],
      street: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
    });
  }

  private loadProfile(): void {
    this.isLoading.set(true);

    this.patientService.getMyProfile().subscribe({
      next: (profile) => {
        // Profile exists -> populate form
        this.form.patchValue({
          firstName: profile.firstName,
          lastName: profile.lastName,
          dateOfBirth: profile.dateOfBirth,
          phone: profile.phone,
          street: profile.address?.street,
          city: profile.address?.city,
          country: profile.address?.country,
        });

        this.wizardStore().setProfile(profile);
        this.isCreateMode.set(false);
        this.isLoading.set(false);

        if (
          this.isProfileCompleteForWizard(profile) &&
          !this.hasAutoAdvanced()
        ) {
          this.hasAutoAdvanced.set(true);
          this.completed.emit();
        }
      },
      error: (error: ApiError) => {
        this.isLoading.set(false);

        // 404 = new patient (create mode)
        if (
          error.code === ApiErrorCode.PROFILE_NOT_FOUND ||
          error.status === 404
        ) {
          this.prefillFromAuthenticatedUser();
          this.isCreateMode.set(true);
          this.toast.info('Completa tu perfil para reservar tu primera cita');
        } else {
          this.toast.error(getUserMessage(error));
        }
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isSaving.set(true);

    const formValue = this.form.value;
    const dto: CreatePatientProfileDto | UpdatePatientProfileDto = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      dateOfBirth:
        formValue.dateOfBirth instanceof Date
          ? formatDateOnly(formValue.dateOfBirth)
          : formValue.dateOfBirth,
      phone: formValue.phone,
      address: {
        street: formValue.street,
        city: formValue.city,
        country: formValue.country,
      },
      hasInsurance: false,
    };

    const request = this.isCreateMode()
      ? this.patientService.createProfile(dto as CreatePatientProfileDto)
      : this.patientService.updateProfile(dto);

    request.subscribe({
      next: (profile) => {
        const safeProfile = this.toSafeProfile(profile, dto);
        this.isSaving.set(false);
        this.wizardStore().setProfile(safeProfile);
        this.toast.success(
          this.isCreateMode()
            ? 'Perfil creado correctamente'
            : 'Perfil actualizado correctamente',
        );
        this.completed.emit();
      },
      error: (error: ApiError) => {
        this.isSaving.set(false);
        this.toast.error(getUserMessage(error));
      },
    });
  }

  private prefillFromAuthenticatedUser(): void {
    const user = this.authStore.user();
    if (!user) return;

    const nameParts = (user.name || '').trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.slice(1).join(' ');
    const phone =
      (user as { phone?: string; phoneNumber?: string }).phone ??
      (user as { phone?: string; phoneNumber?: string }).phoneNumber ??
      '';

    this.form.patchValue({
      firstName,
      lastName,
      phone,
    });
  }

  private toSafeProfile(
    profile: unknown,
    dto: CreatePatientProfileDto | UpdatePatientProfileDto,
  ): PatientProfileDto {
    if (profile && typeof profile === 'object' && 'firstName' in profile) {
      return profile as PatientProfileDto;
    }

    const user = this.authStore.user();
    const firstName = dto.firstName ?? this.form.get('firstName')?.value ?? '';
    const lastName = dto.lastName ?? this.form.get('lastName')?.value ?? '';
    const dateOfBirth =
      dto.dateOfBirth ?? this.form.get('dateOfBirth')?.value ?? '1900-01-01';
    const phone = dto.phone ?? this.form.get('phone')?.value ?? '';
    const address = dto.address ?? {
      street: this.form.get('street')?.value ?? '',
      city: this.form.get('city')?.value ?? '',
      country: this.form.get('country')?.value ?? '',
    };

    return {
      id: '',
      userId: user?.id ?? '',
      firstName,
      lastName,
      dateOfBirth,
      phone,
      email: user?.email ?? '',
      address,
      hasInsurance: dto.hasInsurance ?? false,
      isProfileComplete: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  private isProfileCompleteForWizard(profile: PatientProfileDto): boolean {
    return !!(
      profile.firstName &&
      profile.lastName &&
      profile.dateOfBirth &&
      profile.phone &&
      profile.address?.street &&
      profile.address?.city &&
      profile.address?.country
    );
  }
}
