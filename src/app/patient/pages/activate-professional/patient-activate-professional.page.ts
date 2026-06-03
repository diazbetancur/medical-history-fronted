import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthStore, PostLoginNavigationService } from '@core/auth';
import { ProblemDetails } from '@core/models';
import { AuthApi } from '@data/api';
import { ToastService } from '@shared/services';

@Component({
  selector: 'app-patient-activate-professional-page',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './patient-activate-professional.page.html',
  styleUrl: './patient-activate-professional.page.scss',
})
export class PatientActivateProfessionalPage {
  private readonly authApi = inject(AuthApi);
  private readonly authStore = inject(AuthStore);
  private readonly postLoginNavigation = inject(PostLoginNavigationService);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly professionalContext = computed(() =>
    this.authStore
      .availableContexts()
      .find((context) => context.type === 'PROFESSIONAL'),
  );

  readonly hasProfessionalContext = computed(
    () => !!this.professionalContext(),
  );

  activateProfessional(): void {
    if (this.professionalContext()) {
      this.goToProfessional();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authApi
      .becomeProfessional({ reason: 'Activación desde menú paciente' })
      .subscribe({
        next: (result) => {
          if (!result.success) {
            this.errorMessage.set(
              result.message ||
                'No fue posible activar tu perfil profesional en este momento.',
            );
            this.isLoading.set(false);
            return;
          }

          this.authStore.loadMe().subscribe({
            next: () => {
              this.isLoading.set(false);
              this.toast.success(
                result.message || 'Perfil profesional activado correctamente',
              );
              this.goToProfessional();
            },
            error: (error) => {
              const problem = this.extractProblemDetails(error);
              this.errorMessage.set(
                problem.title || 'No se pudo actualizar tu sesión.',
              );
              this.isLoading.set(false);
            },
          });
        },
        error: (error) => {
          const problem = this.extractProblemDetails(error);
          this.errorMessage.set(
            problem.title ||
              'No fue posible activar tu perfil profesional en este momento.',
          );
          this.isLoading.set(false);
        },
      });
  }

  goToProfessional(): void {
    const context = this.professionalContext();

    if (!context) {
      this.errorMessage.set(
        'No encontramos un contexto profesional activo para tu usuario.',
      );
      return;
    }

    this.postLoginNavigation.navigateTo(context);
  }

  private extractProblemDetails(error: unknown): ProblemDetails {
    if (
      error &&
      typeof error === 'object' &&
      'error' in error &&
      error.error &&
      typeof error.error === 'object'
    ) {
      const err = error.error as Partial<ProblemDetails>;
      if (err.type && err.title && err.status) {
        return err as ProblemDetails;
      }
    }

    return {
      type: 'about:blank',
      title: 'Error en la solicitud',
      status: 500,
    };
  }
}
