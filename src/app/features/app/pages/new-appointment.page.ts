import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import type { TimeSlotDto } from '@data/models/availability.models';
import { PatientAppointmentsStore } from '@data/stores/patient-appointments.store';
import { ProfessionalsSearchStore } from '@data/stores/professionals-search.store';

/**
 * New Appointment Page
 *
 * Permite al paciente crear una nueva cita seleccionando un horario disponible.
 */
@Component({
  selector: 'app-new-appointment-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  template: `
    <div class="new-appointment-page">
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando información...</p>
        </div>
      } @else {
        <!-- Back Button -->
        <button mat-button class="back-btn" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          Volver
        </button>

        <!-- Header -->
        <header class="page-header">
          <h1>Agendar Nueva Cita</h1>
          <p class="subtitle">
            Selecciona un horario disponible y confirma tu cita
          </p>
        </header>

        <!-- Professional Info Card -->
        @if (professionalName()) {
          <mat-card class="info-card">
            <mat-card-header>
              <div mat-card-avatar class="professional-avatar">
                <mat-icon>person</mat-icon>
              </div>
              <mat-card-title>{{ professionalName() }}</mat-card-title>
              <mat-card-subtitle>
                <mat-icon>calendar_today</mat-icon>
                {{ formattedDate() }}
              </mat-card-subtitle>
            </mat-card-header>
          </mat-card>
        }

        <!-- Time Slots Selection -->
        <mat-card class="slots-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>schedule</mat-icon>
              Selecciona un Horario
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            @if (appointmentStore.isLoading()) {
              <div class="loading-slots">
                <mat-spinner diameter="30"></mat-spinner>
                <span>Cargando horarios disponibles...</span>
              </div>
            } @else if (availableSlots().length === 0) {
              <div class="no-slots">
                <mat-icon>event_busy</mat-icon>
                <p>No hay horarios disponibles para esta fecha</p>
                <button mat-raised-button color="primary" (click)="goBack()">
                  Seleccionar otra fecha
                </button>
              </div>
            } @else {
              <div class="slots-grid">
                @for (slot of availableSlots(); track slot.startTime) {
                  <button
                    mat-stroked-button
                    class="slot-button"
                    [class.selected]="isSlotSelected(slot)"
                    [disabled]="!slot.isAvailable"
                    (click)="selectSlot(slot)"
                    [matTooltip]="getSlotTooltip(slot)"
                  >
                    <mat-icon>access_time</mat-icon>
                    <span class="time">{{ slot.startTime }}</span>
                    <span class="duration">{{ slot.duration }} min</span>
                    @if (!slot.isAvailable) {
                      <mat-icon class="unavailable-icon">block</mat-icon>
                    }
                  </button>
                }
              </div>

              @if (selectedSlot()) {
                <div class="selected-info">
                  <mat-icon>check_circle</mat-icon>
                  <span>
                    Horario seleccionado:
                    <strong
                      >{{ selectedSlot()!.startTime }} -
                      {{ selectedSlot()!.endTime }}</strong
                    >
                  </span>
                </div>
              }
            }
          </mat-card-content>
        </mat-card>

        <!-- Notes Form -->
        @if (selectedSlot()) {
          <mat-card class="notes-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>note</mat-icon>
                Notas Adicionales (Opcional)
              </mat-card-title>
            </mat-card-header>

            <mat-card-content>
              <form [formGroup]="appointmentForm">
                <mat-form-field appearance="outline" class="notes-field">
                  <mat-label>Motivo de consulta o notas</mat-label>
                  <textarea
                    matInput
                    formControlName="notes"
                    rows="4"
                    maxlength="500"
                    placeholder="Ej: Dolor de cabeza constante, dolor en el pecho..."
                  ></textarea>
                  <mat-hint align="end">
                    {{ appointmentForm.get('notes')?.value?.length || 0 }} / 500
                  </mat-hint>
                </mat-form-field>
              </form>
            </mat-card-content>

            <mat-card-actions>
              <button
                mat-raised-button
                color="primary"
                [disabled]="
                  !appointmentStore.canCreateAppointment() ||
                  appointmentStore.isCreating()
                "
                (click)="createAppointment()"
                class="confirm-btn"
              >
                @if (appointmentStore.isCreating()) {
                  <mat-spinner diameter="20"></mat-spinner>
                  <span>Creando cita...</span>
                } @else {
                  <mat-icon>event_available</mat-icon>
                  <span>Confirmar Cita</span>
                }
              </button>

              <button
                mat-button
                (click)="goBack()"
                [disabled]="appointmentStore.isCreating()"
              >
                Cancelar
              </button>
            </mat-card-actions>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [
    `
      .new-appointment-page {
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

      .page-header {
        margin-bottom: 24px;

        h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 500;
        }

        .subtitle {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: 16px;
        }
      }

      .info-card {
        margin-bottom: 24px;

        .professional-avatar {
          background: var(--gradient-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
          }
        }

        mat-card-subtitle {
          display: flex;
          align-items: center;
          gap: 4px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }

      .slots-card {
        margin-bottom: 24px;

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

        .loading-slots {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          color: var(--color-text-secondary);
        }

        .no-slots {
          text-align: center;
          padding: 48px 24px;

          mat-icon {
            font-size: 64px;
            width: 64px;
            height: 64px;
            margin-bottom: 16px;
            color: var(--color-text-disabled);
          }

          p {
            margin: 0 0 24px 0;
            color: var(--color-text-secondary);
            font-size: 16px;
          }
        }

        .slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .slot-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 16px 12px;
          position: relative;
          transition: all 0.2s ease;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }

          .time {
            font-size: 16px;
            font-weight: 500;
          }

          .duration {
            font-size: 12px;
            color: var(--color-text-secondary);
          }

          .unavailable-icon {
            position: absolute;
            top: 8px;
            right: 8px;
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: var(--color-error);
          }

          &.selected {
            background-color: var(--color-primary);
            color: white;
            border-color: var(--color-primary);

            .duration {
              color: rgba(255, 255, 255, 0.8);
            }
          }

          &:disabled:not(.selected) {
            opacity: 0.4;
            cursor: not-allowed;
          }

          &:not(:disabled):not(.selected):hover {
            background-color: rgba(63, 81, 181, 0.1);
            border-color: var(--color-primary);
          }
        }

        .selected-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background-color: var(--color-success-bg);
          border-radius: 4px;
          color: var(--color-success-dark);

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }
      }

      .notes-card {
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

        .notes-field {
          width: 100%;
        }

        mat-card-actions {
          padding: 16px;
          display: flex;
          gap: 12px;

          .confirm-btn {
            mat-icon,
            mat-spinner {
              margin-right: 8px;
            }
          }
        }
      }

      @media (max-width: 768px) {
        .new-appointment-page {
          padding: 16px;
        }

        .slots-card .slots-grid {
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        }

        .notes-card mat-card-actions {
          flex-direction: column;

          button {
            width: 100%;
          }
        }
      }
    `,
  ],
})
export class NewAppointmentPage implements OnInit, OnDestroy {
  protected readonly appointmentStore = inject(PatientAppointmentsStore);
  protected readonly professionalsStore = inject(ProfessionalsSearchStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly appointmentForm = new FormGroup({
    notes: new FormControl('', [Validators.maxLength(500)]),
  });

  protected readonly isLoading = signal(true);
  protected readonly professionalSlug = signal('');
  protected readonly selectedDate = signal('');

  protected readonly professionalName = computed(() =>
    this.appointmentStore.professionalName(),
  );

  protected readonly availableSlots = computed(() =>
    this.appointmentStore.availableSlots(),
  );

  protected readonly selectedSlot = computed(() =>
    this.appointmentStore.selectedSlot(),
  );

  protected readonly formattedDate = computed(() => {
    const dateStr = this.selectedDate();
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(+year, +month - 1, +day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  ngOnInit(): void {
    // Leer query params
    const professional = this.route.snapshot.queryParamMap.get('professional');
    const date = this.route.snapshot.queryParamMap.get('date');

    if (!professional || !date) {
      this.router.navigate(['/patient/professionals']);
      return;
    }

    this.professionalSlug.set(professional);
    this.selectedDate.set(date);

    // Cargar información del profesional
    this.professionalsStore.loadProfessionalBySlug(professional);

    // Esperar a que se cargue el profesional para inicializar
    const prof = this.professionalsStore.selectedProfessional();
    if (prof) {
      this.appointmentStore.initializeAppointmentFlow(prof.id, prof.name);
      this.appointmentStore.loadAvailableSlots(date);
      this.isLoading.set(false);
    } else {
      // Retry después de un breve delay
      setTimeout(() => {
        const prof = this.professionalsStore.selectedProfessional();
        if (prof) {
          this.appointmentStore.initializeAppointmentFlow(prof.id, prof.name);
          this.appointmentStore.loadAvailableSlots(date);
        }
        this.isLoading.set(false);
      }, 1000);
    }
  }

  ngOnDestroy(): void {
    this.appointmentStore.resetState();
  }

  protected selectSlot(slot: TimeSlotDto): void {
    this.appointmentStore.selectSlot(slot);
  }

  protected isSlotSelected(slot: TimeSlotDto): boolean {
    const selected = this.selectedSlot();
    return selected?.startTime === slot.startTime;
  }

  protected getSlotTooltip(slot: TimeSlotDto): string {
    if (!slot.isAvailable) {
      return 'Este horario ya no está disponible';
    }
    return `Disponible: ${slot.startTime} - ${slot.endTime} (${slot.duration} minutos)`;
  }

  protected createAppointment(): void {
    const notes = this.appointmentForm.get('notes')?.value || undefined;
    this.appointmentStore.createAppointment(notes);
  }

  protected goBack(): void {
    const slug = this.professionalSlug();
    if (slug) {
      this.router.navigate(['/patient/professionals', slug]);
    } else {
      this.router.navigate(['/patient/professionals']);
    }
  }
}
