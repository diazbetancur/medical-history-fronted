import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiError, ApiErrorCode, getUserMessage } from '@core/http/api-error';
import { ToastService } from '@core/ui/toast.service';
import { CreateAppointmentDto } from '../../../models/appointment.dto';
import { formatSlotTime } from '../../../models/slot.dto';
import { AppointmentsService } from '../../../services/appointments.service';
import { WizardStore } from '../patient-wizard.page';

@Component({
  selector: 'app-step4-confirm',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  template: `
    <div class="step-container">
      <h2>Confirmar Reserva</h2>
      <p class="subtitle">Revisa los detalles de tu cita antes de confirmar</p>

      <!-- Summary Card -->
      <mat-card class="summary-card">
        <mat-card-content>
          <div class="summary-section">
            <div class="summary-item">
              <mat-icon>person</mat-icon>
              <div class="summary-item-content">
                <span class="label">Paciente</span>
                <span class="value">{{ patientName() }}</span>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="summary-item">
              <mat-icon>local_hospital</mat-icon>
              <div class="summary-item-content">
                <span class="label">Profesional</span>
                <span class="value">{{ professionalName() }}</span>
                <span class="subvalue">{{ professionalSpecialty() }}</span>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="summary-item">
              <mat-icon>event</mat-icon>
              <div class="summary-item-content">
                <span class="label">Fecha</span>
                <span class="value">{{ formattedDate() }}</span>
              </div>
            </div>

            <mat-divider></mat-divider>

            <div class="summary-item">
              <mat-icon>schedule</mat-icon>
              <div class="summary-item-content">
                <span class="label">Horario</span>
                <span class="value">{{ slotTime() }}</span>
              </div>
            </div>
          </div>

          <!-- Loading spinner -->
          @if (isSubmitting()) {
            <div class="loading-overlay">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Confirmando tu cita...</p>
            </div>
          }

          <!-- Error retry -->
          @if (
            submitError() && submitError()?.code !== 'TIME_SLOT_UNAVAILABLE'
          ) {
            <div class="error-section">
              <mat-icon color="warn">error</mat-icon>
              <p class="error-message">{{ submitError()?.message }}</p>
              <button mat-button color="primary" (click)="retrySubmit()">
                Reintentar
              </button>
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Important notes -->
      <mat-card class="notes-card">
        <mat-card-content>
          <h3>
            <mat-icon>info</mat-icon>
            Información importante
          </h3>
          <ul>
            <li>Por favor, llega 10 minutos antes de tu cita</li>
            <li>Trae tu documento de identidad</li>
            <li>
              Puedes cancelar tu cita hasta 24 horas antes sin penalización
            </li>
          </ul>
        </mat-card-content>
      </mat-card>

      <div class="actions">
        <button mat-button (click)="back.emit()" [disabled]="isSubmitting()">
          Atrás
        </button>
        <button
          mat-raised-button
          color="primary"
          (click)="onConfirm()"
          [disabled]="isSubmitting()"
        >
          @if (isSubmitting()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            Confirmar Reserva
          }
        </button>
      </div>
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
        color: rgba(0, 0, 0, 0.6);
      }

      .summary-card {
        margin-bottom: 16px;
        position: relative;

        .summary-section {
          display: flex;
          flex-direction: column;
          gap: 16px;

          .summary-item {
            display: flex;
            align-items: flex-start;
            gap: 16px;

            mat-icon {
              margin-top: 4px;
              color: rgba(0, 0, 0, 0.54);
            }

            .summary-item-content {
              display: flex;
              flex-direction: column;
              flex: 1;

              .label {
                font-size: 12px;
                color: rgba(0, 0, 0, 0.6);
                text-transform: uppercase;
                margin-bottom: 4px;
              }

              .value {
                font-size: 16px;
                font-weight: 500;
              }

              .subvalue {
                font-size: 14px;
                color: rgba(0, 0, 0, 0.6);
              }
            }
          }

          mat-divider {
            margin: 0;
          }
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;

          p {
            margin: 0;
            font-size: 14px;
            color: rgba(0, 0, 0, 0.6);
          }
        }

        .error-section {
          margin-top: 16px;
          padding: 16px;
          background: #ffebee;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
          }

          .error-message {
            margin: 0;
            text-align: center;
            color: rgba(0, 0, 0, 0.87);
          }
        }
      }

      .notes-card {
        background: #e3f2fd;

        h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 500;

          mat-icon {
            color: #1976d2;
          }
        }

        ul {
          margin: 0;
          padding-left: 24px;

          li {
            margin-bottom: 8px;

            &:last-child {
              margin-bottom: 0;
            }
          }
        }
      }

      .actions {
        display: flex;
        justify-content: space-between;
        margin-top: 24px;

        button[mat-raised-button] {
          min-width: 180px;

          mat-spinner {
            display: inline-block;
            margin: 0 auto;
          }
        }
      }
    `,
  ],
})
export class Step4ConfirmComponent implements OnInit {
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly toast = inject(ToastService);

  // Inputs/Outputs
  readonly wizardStore = input.required<WizardStore>();
  readonly completed = output<void>();
  readonly slotUnavailable = output<void>();
  readonly back = output<void>();

  // State
  readonly isSubmitting = signal(false);
  readonly submitError = signal<ApiError | null>(null);

  // Computed
  readonly patientName = computed(() => {
    const profile = this.wizardStore().profile();
    return profile
      ? `${profile.firstName} ${profile.lastName}`
      : 'No disponible';
  });

  readonly professionalName = computed(
    () => this.wizardStore().selectedProfessional()?.name ?? 'No disponible',
  );

  readonly professionalSpecialty = computed(
    () =>
      this.wizardStore().selectedProfessional()?.specialty ?? 'No disponible',
  );

  readonly formattedDate = computed(() => {
    const dateStr = this.wizardStore().selectedDate();
    if (!dateStr) return 'No disponible';

    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    } catch {
      return dateStr;
    }
  });

  readonly slotTime = computed(() => {
    const slot = this.wizardStore().selectedSlot();
    return slot ? formatSlotTime(slot) : 'No disponible';
  });

  ngOnInit(): void {
    // Clear any previous errors
    this.submitError.set(null);
  }

  /**
   * Confirm appointment
   */
  onConfirm(): void {
    const professional = this.wizardStore().selectedProfessional();
    const date = this.wizardStore().selectedDate();
    const slot = this.wizardStore().selectedSlot();

    if (!professional || !date || !slot) {
      this.toast.error('Faltan datos para confirmar la cita');
      return;
    }

    const dto: CreateAppointmentDto = {
      professionalProfileId: professional.professionalProfileId,
      date: date,
      slotId: slot.id,
      notes: undefined,
    };

    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.appointmentsService.createAppointment(dto).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toast.success('¡Cita reservada exitosamente!');
        this.completed.emit();
      },
      error: (error: ApiError) => {
        this.isSubmitting.set(false);

        // Check if slot became unavailable
        if (error.code === ApiErrorCode.TIME_SLOT_UNAVAILABLE) {
          this.toast.error(
            'El horario seleccionado ya no está disponible. Por favor, elige otro.',
          );
          // Emit event to go back to Step 3
          this.slotUnavailable.emit();
        } else {
          // Other errors - show error and allow retry
          this.submitError.set(error);
          this.toast.error(getUserMessage(error));
        }
      },
    });
  }

  /**
   * Retry submit after error
   */
  retrySubmit(): void {
    this.onConfirm();
  }
}
