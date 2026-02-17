import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientAppointmentsStore } from '@data/stores/patient-appointments.store';
import { ProfessionalsSearchStore } from '@data/stores/professionals-search.store';

/**
 * Professional Detail Page
 *
 * Muestra el perfil público de un profesional y permite ver disponibilidad.
 */
@Component({
  selector: 'app-professional-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="professional-detail-page">
      @if (searchStore.isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando perfil del profesional...</p>
        </div>
      } @else if (professional()) {
        <!-- Back Button -->
        <button mat-button class="back-btn" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Volver a búsqueda
        </button>

        <!-- Professional Profile Card -->
        <mat-card class="profile-card">
          <mat-card-header>
            <div mat-card-avatar class="professional-avatar">
              <mat-icon>person</mat-icon>
            </div>
            <mat-card-title>{{ professional()!.name }}</mat-card-title>
            <mat-card-subtitle>
              @if (professional()!.specialty) {
                <mat-icon class="specialty-icon">medical_services</mat-icon>
                {{ professional()!.specialty }}
              }
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <div class="profile-info">
              @if (professional()!.location) {
                <div class="info-row">
                  <mat-icon>location_on</mat-icon>
                  <span>{{ professional()!.location }}</span>
                </div>
              }

              @if (professional()!.rating) {
                <div class="info-row rating">
                  <mat-icon class="star-icon">star</mat-icon>
                  <span>{{ professional()!.rating.toFixed(1) }} / 5.0</span>
                </div>
              }

              @if (!professional()!.isActive) {
                <mat-chip color="warn">No disponible actualmente</mat-chip>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Availability Section -->
        @if (professional()!.isActive) {
          <mat-card class="availability-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>calendar_today</mat-icon>
                Ver Disponibilidad
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <p class="section-description">
                Selecciona una fecha para ver los horarios disponibles
              </p>

              <mat-form-field appearance="outline" class="date-picker">
                <mat-label>Selecciona una fecha</mat-label>
                <input
                  matInput
                  [matDatepicker]="picker"
                  [formControl]="dateControl"
                  [min]="minDate"
                  placeholder="DD/MM/YYYY"
                />
                <mat-datepicker-toggle
                  matIconSuffix
                  [for]="picker"
                ></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>

              @if (selectedDateFormatted()) {
                <div class="availability-results">
                  @if (appointmentsStore.isLoading()) {
                    <div class="loading-slots">
                      <mat-spinner diameter="30"></mat-spinner>
                      <span>Cargando horarios...</span>
                    </div>
                  } @else if (appointmentsStore.hasAvailableSlots()) {
                    <h4>
                      Horarios disponibles para {{ selectedDateFormatted() }}
                    </h4>
                    <p class="slots-hint">
                      Haz clic en "Agendar Cita" para continuar
                    </p>
                    <div class="action-buttons">
                      <button
                        mat-raised-button
                        color="primary"
                        (click)="bookAppointment()"
                      >
                        <mat-icon>event</mat-icon>
                        Agendar Cita
                      </button>
                    </div>
                  } @else {
                    <div class="no-slots">
                      <mat-icon>event_busy</mat-icon>
                      <p>No hay horarios disponibles para esta fecha</p>
                      <p class="hint">Intenta seleccionar otra fecha</p>
                    </div>
                  }
                </div>
              }
            </mat-card-content>
          </mat-card>
        }
      } @else {
        <!-- Error State -->
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon class="error-icon">error_outline</mat-icon>
            <h3>Profesional no encontrado</h3>
            <p>El profesional que buscas no existe o no está disponible</p>
            <button mat-raised-button color="primary" (click)="goBack()">
              Volver a búsqueda
            </button>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [
    `
      .professional-detail-page {
        padding: 24px;
        max-width: 900px;
        margin: 0 auto;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px 24px;

        p {
          margin-top: 16px;
          color: var(--color-text-secondary);
        }
      }

      .back-btn {
        margin-bottom: 16px;

        mat-icon {
          margin-right: 4px;
        }
      }

      .profile-card {
        margin-bottom: 24px;

        .professional-avatar {
          background: var(--gradient-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;

          mat-icon {
            font-size: 40px;
            width: 40px;
            height: 40px;
          }
        }

        mat-card-header {
          mat-card-title {
            font-size: 24px;
          }

          mat-card-subtitle {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 16px;

            .specialty-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }
          }
        }

        .profile-info {
          margin-top: 16px;

          .info-row {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            font-size: 16px;
            color: var(--color-text-primary);

            mat-icon {
              font-size: 20px;
              width: 20px;
              height: 20px;
            }

            &.rating {
              .star-icon {
                color: var(--color-warning);
              }
            }
          }
        }
      }

      .availability-card {
        mat-card-header {
          mat-card-title {
            display: flex;
            align-items: center;
            gap: 8px;

            mat-icon {
              font-size: 24px;
              width: 24px;
              height: 24px;
            }
          }
        }

        .section-description {
          margin: 0 0 16px 0;
          color: var(--color-text-secondary);
        }

        .date-picker {
          width: 100%;
          max-width: 400px;
        }

        .availability-results {
          margin-top: 24px;

          h4 {
            margin: 0 0 8px 0;
            font-size: 18px;
            font-weight: 500;
          }

          .slots-hint {
            margin: 0 0 16px 0;
            color: var(--color-text-secondary);
            font-size: 14px;
          }

          .loading-slots {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 24px;
            color: var(--color-text-secondary);
          }

          .action-buttons {
            display: flex;
            gap: 12px;

            button mat-icon {
              margin-right: 8px;
            }
          }

          .no-slots {
            text-align: center;
            padding: 32px;
            color: var(--color-text-secondary);

            mat-icon {
              font-size: 48px;
              width: 48px;
              height: 48px;
              margin-bottom: 16px;
              color: var(--color-text-disabled);
            }

            p {
              margin: 8px 0;
            }

            .hint {
              font-size: 14px;
              color: var(--color-text-disabled);
            }
          }
        }
      }

      .error-card {
        text-align: center;
        padding: 64px 24px;

        .error-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: var(--color-error);
          margin: 0 auto 16px;
        }

        h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 500;
        }

        p {
          margin: 0 0 24px 0;
          color: var(--color-text-secondary);
        }
      }

      @media (max-width: 768px) {
        .professional-detail-page {
          padding: 16px;
        }

        .profile-card .professional-avatar {
          width: 48px;
          height: 48px;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
          }
        }
      }
    `,
  ],
})
export class ProfessionalDetailPage implements OnInit, OnDestroy {
  protected readonly searchStore = inject(ProfessionalsSearchStore);
  protected readonly appointmentsStore = inject(PatientAppointmentsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly dateControl = new FormControl<Date | null>(null);
  protected readonly minDate = new Date(); // No permitir fechas pasadas

  protected readonly professional = computed(() =>
    this.searchStore.selectedProfessional(),
  );

  protected readonly selectedDateFormatted = computed(() => {
    const date = this.dateControl.value;
    if (!date) return '';
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.searchStore.loadProfessionalBySlug(slug);
    }

    // Listen to date changes
    this.dateControl.valueChanges.subscribe((date) => {
      if (date && this.professional()?.id) {
        const dateStr = this.formatDateISO(date);
        this.appointmentsStore.initializeAppointmentFlow(
          this.professional()!.id,
          this.professional()!.name,
        );
        this.appointmentsStore.loadAvailableSlots(dateStr);
      }
    });
  }

  ngOnDestroy(): void {
    this.searchStore.clearSelectedProfessional();
    this.appointmentsStore.resetState();
  }

  protected goBack(): void {
    this.router.navigate(['/patient/professionals']);
  }

  protected bookAppointment(): void {
    const date = this.dateControl.value;
    if (!date || !this.professional()) return;

    const dateStr = this.formatDateISO(date);
    this.router.navigate(['/patient/appointments/new'], {
      queryParams: {
        professional: this.professional()!.slug,
        date: dateStr,
      },
    });
  }

  private formatDateISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
