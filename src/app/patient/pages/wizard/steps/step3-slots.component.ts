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
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiError, getUserMessage } from '@core/http/api-error';
import { formatDateOnly } from '@core/http/http-utils';
import { ToastService } from '@core/ui/toast.service';
import { formatSlotTime, SlotDto } from '../../../models/slot.dto';
import { SlotsService } from '../../../services/slots.service';
import { WizardStore } from '../patient-wizard.page';

@Component({
  selector: 'app-step3-slots',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="step-container">
      <h2>Selecciona Fecha y Hora</h2>
      <p class="subtitle">
        Elige la fecha y el horario disponible para tu cita con
        {{ professionalName() }}
      </p>

      <!-- Date Picker -->
      <mat-card class="date-picker-card">
        <mat-card-content>
          <mat-form-field appearance="outline">
            <mat-label>Selecciona una fecha</mat-label>
            <input
              matInput
              [matDatepicker]="picker"
              [min]="minDate"
              [(ngModel)]="selectedDate"
              (dateChange)="onDateChange($event.value)"
            />
            <mat-datepicker-toggle
              matIconSuffix
              [for]="picker"
            ></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <!-- Slots -->
      @if (selectedDate()) {
        <div class="slots-section">
          <h3>Horarios Disponibles</h3>

          @if (isLoadingSlots()) {
            <div class="loading">
              <mat-spinner diameter="40"></mat-spinner>
              <p>Cargando horarios...</p>
            </div>
          } @else if (availableSlots().length === 0) {
            <mat-card class="no-slots-card">
              <mat-card-content>
                <mat-icon>event_busy</mat-icon>
                <p>No hay horarios disponibles para esta fecha</p>
                <p class="hint">Por favor, selecciona otra fecha</p>
              </mat-card-content>
            </mat-card>
          } @else {
            <div class="slots-grid">
              @for (slot of availableSlots(); track slot.id) {
                <mat-chip
                  class="slot-chip"
                  [class.selected]="selectedSlot()?.id === slot.id"
                  (click)="selectSlot(slot)"
                  [highlighted]="selectedSlot()?.id === slot.id"
                  [color]="
                    selectedSlot()?.id === slot.id ? 'primary' : undefined
                  "
                >
                  <mat-icon matChipAvatar>schedule</mat-icon>
                  {{ formatSlotTime(slot) }}
                </mat-chip>
              }
            </div>
          }
        </div>
      }

      <div class="actions">
        <button mat-button (click)="back.emit()">Atrás</button>
        <button
          mat-raised-button
          color="primary"
          [disabled]="!selectedSlot()"
          (click)="onNext()"
        >
          Siguiente
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
        color: var(--color-text-secondary);
      }

      .date-picker-card {
        margin-bottom: 24px;

        mat-form-field {
          width: 100%;
        }
      }

      .slots-section {
        h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 500;
        }

        .loading {
          text-align: center;
          padding: 48px;

          p {
            margin-top: 16px;
          }
        }

        .no-slots-card {
          text-align: center;
          padding: 24px;

          mat-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
            color: var(--color-text-disabled);
          }

          p {
            margin: 16px 0 4px 0;
            font-size: 16px;
          }

          .hint {
            margin: 0;
            font-size: 14px;
            color: var(--color-text-secondary);
          }
        }

        .slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;

          .slot-chip {
            height: 48px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 16px;

            &:hover:not(.selected) {
              transform: scale(1.05);
            }

            &.selected {
              font-weight: 500;
            }
          }
        }
      }

      .actions {
        display: flex;
        justify-content: space-between;
        margin-top: 24px;
      }

      @media (max-width: 768px) {
        .slots-grid {
          grid-template-columns: 1fr 1fr;
        }
      }
    `,
  ],
})
export class Step3SlotsComponent implements OnInit {
  private readonly slotsService = inject(SlotsService);
  private readonly toast = inject(ToastService);

  // Inputs/Outputs
  readonly wizardStore = input.required<WizardStore>();
  readonly completed = output<void>();
  readonly back = output<void>();

  // State
  readonly isLoadingSlots = signal(false);
  readonly allSlots = signal<SlotDto[]>([]);
  readonly selectedDate = signal<Date | null>(null);
  readonly selectedSlot = signal<SlotDto | null>(null);

  // Date constraints
  readonly minDate = new Date(); // Today

  // Computed
  readonly professionalName = computed(
    () => this.wizardStore().selectedProfessional()?.name ?? '',
  );
  readonly professionalId = computed(
    () =>
      this.wizardStore().selectedProfessional()?.professionalProfileId ?? '',
  );
  readonly availableSlots = computed(() =>
    this.allSlots().filter((s) => s.isAvailable),
  );

  ngOnInit(): void {
    const professionalId = this.professionalId();
    if (!professionalId) {
      return;
    }

    if (!this.selectedDate()) {
      const today = new Date();
      this.selectedDate.set(today);
      this.loadSlots(today);
    }
  }

  /**
   * Format slot time for display
   */
  formatSlotTime(slot: SlotDto): string {
    return formatSlotTime(slot);
  }

  /**
   * Date changed
   */
  onDateChange(date: Date | null): void {
    if (date) {
      this.selectedSlot.set(null); // Reset slot selection
      this.loadSlots(date);
    }
  }

  /**
   * Load slots for selected date
   */
  private loadSlots(date: Date): void {
    const dateStr = formatDateOnly(date);
    const professionalId = this.professionalId();

    if (!professionalId) {
      return;
    }

    this.isLoadingSlots.set(true);

    this.slotsService.getSlots(professionalId, dateStr).subscribe({
      next: (response) => {
        this.allSlots.set(response.slots);
        this.isLoadingSlots.set(false);

        if (response.slots.filter((s) => s.isAvailable).length === 0) {
          this.toast.warning('No hay horarios disponibles para esta fecha');
        }
      },
      error: (error: ApiError) => {
        this.isLoadingSlots.set(false);
        this.toast.error(getUserMessage(error));
      },
    });
  }

  /**
   * Select slot
   */
  selectSlot(slot: SlotDto): void {
    if (!slot.isAvailable) return;
    this.selectedSlot.set(slot);
  }

  /**
   * Go to next step
   */
  onNext(): void {
    const date = this.selectedDate();
    const slot = this.selectedSlot();

    if (date && slot) {
      const dateStr = formatDateOnly(date);
      this.wizardStore().setDateAndSlot(dateStr, slot);
      this.completed.emit();
    }
  }
}
