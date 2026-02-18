import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { Router } from '@angular/router';
import { AuthStore } from '@core/auth';
import { ProblemDetails } from '@core/models';
import { AuthApi, ProfessionalApi, PublicApi } from '@data/api';
import {
  City,
  Country,
  CreateProfessionalProfilePayload,
} from '@data/api/api-models';
import { ToastService } from '@shared/services';

@Component({
  selector: 'app-professional-onboarding',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
  ],
  templateUrl: './professional-onboarding.page.html',
  styleUrls: ['./professional-onboarding.page.scss'],
})
export class ProfessionalOnboardingPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly professionalApi = inject(ProfessionalApi);
  private readonly publicApi = inject(PublicApi);
  private readonly authApi = inject(AuthApi);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  // ─── Catalog data ──────────────────────────────────────────────────────────
  readonly countries = signal<Country[]>([]);
  readonly cities = signal<City[]>([]);
  readonly filteredCities = computed(() => {
    const countryId = this.profileForm.get('countryId')?.value;
    if (!countryId) return this.cities();
    return this.cities().filter((c) => c.countryId === countryId);
  });

  // ─── Status ────────────────────────────────────────────────────────────────
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly loadingCatalogs = signal(true);

  // ─── Form ──────────────────────────────────────────────────────────────────
  readonly profileForm = this.fb.nonNullable.group({
    businessName: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(2000)]],
    countryId: ['', [Validators.required]],
    cityId: ['', [Validators.required]],
    phone: ['', [Validators.maxLength(20)]],
    whatsApp: ['', [Validators.maxLength(20)]],
    email: ['', [Validators.email, Validators.maxLength(100)]],
    address: ['', [Validators.maxLength(500)]],
  });

  // ─── User info ─────────────────────────────────────────────────────────────
  readonly currentUser = this.authStore.user;

  ngOnInit(): void {
    this.loadCatalogs();
    this.prefillEmailFromUser();
    // When country changes, reset city
    this.profileForm.get('countryId')?.valueChanges.subscribe(() => {
      this.profileForm.get('cityId')?.reset('');
    });
  }

  private prefillEmailFromUser(): void {
    const email = this.currentUser()?.email;
    if (email) {
      this.profileForm.patchValue({ email });
    }
  }

  private loadCatalogs(): void {
    this.loadingCatalogs.set(true);
    this.publicApi.getMetadata().subscribe({
      next: (meta) => {
        this.countries.set(meta.countries ?? []);
        this.cities.set(meta.cities ?? []);
        this.loadingCatalogs.set(false);
      },
      error: () => {
        this.loadingCatalogs.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const value = this.profileForm.getRawValue();
    const payload: CreateProfessionalProfilePayload = {
      businessName: value.businessName,
      description: value.description || undefined,
      countryId: value.countryId,
      cityId: value.cityId,
      phone: value.phone || undefined,
      whatsApp: value.whatsApp || undefined,
      email: value.email || undefined,
      address: value.address || undefined,
    };

    this.professionalApi.createProfile(payload).subscribe({
      next: () => {
        this.toast.success('¡Perfil creado! Ya puedes empezar a trabajar.');
        // Reload user session to get updated contexts/hasProfessionalProfile
        this.authStore.loadMe().subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.router.navigate(['/professional']);
          },
          error: () => {
            this.isSubmitting.set(false);
            this.router.navigate(['/professional']);
          },
        });
      },
      error: (err) => {
        this.submitError.set(
          this.extractError(err) ||
            'No fue posible crear tu perfil. Intenta nuevamente.',
        );
        this.isSubmitting.set(false);
      },
    });
  }

  private extractError(error: unknown): string {
    if (error && typeof error === 'object' && 'error' in error) {
      const e = (error as any).error;
      if (typeof e === 'object') {
        return (e as Partial<ProblemDetails>).title ?? e?.message ?? '';
      }
    }
    return '';
  }
}
