import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import {
  MatDatepickerInputEvent,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiError, getUserMessage } from '@core/http/api-error';
import { formatDateOnly } from '@core/http/http-utils';
import { PublicApi } from '@data/api';
import { CreateAppointmentDto } from '@patient/models/appointment.dto';
import { isSlotInPast, SlotDto } from '@patient/models/slot.dto';
import { AppointmentsService } from '@patient/services/appointments.service';
import { SlotsService } from '@patient/services/slots.service';

export interface BookAppointmentDialogData {
  slug: string;
  professionalId?: string;
  name?: string;
  imageUrl?: string;
  specialties?: string[];
}

interface BookingConfirmation {
  date: string;
  startTime: string;
  endTime: string;
  location: string;
}

@Component({
  selector: 'app-book-appointment-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    MatDialogModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <h2 mat-dialog-title>Agendar cita</h2>

    <mat-dialog-content class="dialog-content">
      @if (bookingConfirmation()) {
        <mat-card class="success-card">
          <mat-card-content>
            <div class="success-title">
              <mat-icon>check_circle</mat-icon>
              <h3>Cita agendada exitosamente</h3>
            </div>

            <div class="summary-row">
              <strong>Médico:</strong>
              <span>{{ professionalName() }}</span>
            </div>
            <div class="summary-row">
              <strong>Fecha:</strong>
              <span>{{ bookingConfirmation()!.date }}</span>
            </div>
            <div class="summary-row">
              <strong>Hora:</strong>
              <span>
                {{ bookingConfirmation()!.startTime }} -
                {{ bookingConfirmation()!.endTime }}
              </span>
            </div>
            <div class="summary-row">
              <strong>Lugar:</strong>
              <span>{{ bookingConfirmation()!.location }}</span>
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <mat-card class="pro-card">
          <div class="pro-layout">
            <div class="avatar">
              @if (imageUrl()) {
                <img [src]="imageUrl()!" [alt]="professionalName()" />
              } @else {
                <mat-icon>person</mat-icon>
              }
            </div>

            <div class="pro-info">
              <h3>{{ professionalName() }}</h3>
              @if (specialties().length > 0) {
                <p>{{ specialties().join(' · ') }}</p>
              }
            </div>
          </div>
        </mat-card>

        @if (loadingProfile()) {
          <div class="state-block">
            <mat-spinner diameter="34"></mat-spinner>
            <p>Cargando profesional...</p>
          </div>
        } @else if (profileError()) {
          <div class="state-block error">{{ profileError() }}</div>
        } @else {
          <mat-form-field appearance="outline" class="date-input">
            <mat-label>Selecciona una fecha</mat-label>
            <input
              matInput
              [matDatepicker]="picker"
              [min]="minDate"
              [value]="selectedDate()"
              (dateChange)="onDatepickerChange($event)"
              placeholder="Selecciona una fecha"
            />
            <mat-datepicker-toggle
              matIconSuffix
              [for]="picker"
            ></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          @if (loadingSlots()) {
            <div class="state-block">
              <mat-spinner diameter="28"></mat-spinner>
              <p>Cargando horarios disponibles...</p>
            </div>
          } @else if (slotsError()) {
            <div class="state-block error">{{ slotsError() }}</div>
          } @else if (selectedDate() && availableSlots().length === 0) {
            <div class="state-block">
              No hay horarios disponibles para esta fecha.
            </div>
          } @else if (availableSlots().length > 0) {
            <div class="slots-list">
              @for (slot of availableSlots(); track slot.id) {
                <button
                  type="button"
                  class="slot-item"
                  (click)="bookSlot(slot)"
                  [disabled]="isBooking()"
                >
                  <div class="slot-time">
                    {{ slot.startTime }} - {{ slot.endTime }}
                  </div>
                  @if (slot.professionalLocationName) {
                    <div class="slot-location">
                      {{ slot.professionalLocationName }}
                    </div>
                  }
                  @if (slot.professionalLocationAddress) {
                    <div class="slot-address">
                      {{ slot.professionalLocationAddress }}
                    </div>
                  }
                </button>
              }
            </div>
          }
        }
      }

      @if (isBooking()) {
        <div class="state-block">
          <mat-spinner diameter="28"></mat-spinner>
          <p>Confirmando cita...</p>
        </div>
      }

      @if (bookingError()) {
        <div class="state-block error">{{ bookingError() }}</div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (bookingConfirmation()) {
        <button mat-flat-button color="primary" (click)="acceptConfirmation()">
          Aceptar
        </button>
      }
      <button mat-button (click)="close()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-content {
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 680px;
      }

      .pro-card {
        border-radius: 10px;
      }

      .pro-layout {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .avatar {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-background-alt);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        mat-icon {
          color: var(--color-text-secondary);
        }
      }

      .pro-info {
        h3 {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 600;
        }

        p {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: 14px;
        }
      }

      .date-input {
        width: 100%;
      }
      .state-block {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        border-radius: 8px;
        background: var(--color-background-alt);
        color: var(--color-text-secondary);

        &.error {
          color: var(--color-danger);
        }
      }

      .slots-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 8px;
      }

      .slot-item {
        appearance: none;
        background: transparent;
        text-align: left;
        cursor: pointer;
        width: 100%;
        padding: 10px;
        border: 1px solid var(--color-border);
        border-radius: 8px;

        &:hover:not(:disabled) {
          border-color: var(--color-primary);
          background: color-mix(in srgb, var(--color-primary) 7%, white);
        }

        &:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .slot-time {
          text-align: center;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .slot-location,
        .slot-address {
          font-size: 12px;
          color: var(--color-text-secondary);
          text-align: center;
          line-height: 1.35;
        }
      }

      .success-card {
        border: 1px solid var(--color-success, #2e7d32);
      }

      .success-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;

        mat-icon {
          color: var(--color-success, #2e7d32);
        }

        h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
      }

      .summary-row {
        display: grid;
        grid-template-columns: 80px 1fr;
        gap: 8px;
        margin-bottom: 6px;
        font-size: 14px;
      }

      @media (max-width: 860px) {
        .dialog-content {
          min-width: auto;
        }
      }
    `,
  ],
})
export class BookAppointmentDialogComponent {
  private readonly publicApi = inject(PublicApi);
  private readonly slotsService = inject(SlotsService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly dialogRef = inject(
    MatDialogRef<BookAppointmentDialogComponent>,
  );
  readonly data = inject<BookAppointmentDialogData>(MAT_DIALOG_DATA);

  readonly loadingProfile = signal(false);
  readonly loadingSlots = signal(false);
  readonly profileError = signal<string | null>(null);
  readonly slotsError = signal<string | null>(null);
  readonly isBooking = signal(false);
  readonly bookingError = signal<string | null>(null);
  readonly bookingConfirmation = signal<BookingConfirmation | null>(null);

  readonly professionalId = signal(this.data.professionalId ?? '');
  readonly professionalName = signal(this.data.name ?? 'Profesional');
  readonly imageUrl = signal(this.data.imageUrl ?? '');
  readonly specialties = signal<string[]>(this.data.specialties ?? []);

  readonly selectedDate = signal<Date | null>(null);
  readonly availableSlots = signal<SlotDto[]>([]);

  readonly minDate = this.getTodayDate();

  constructor() {
    if (!this.professionalId()) {
      this.loadProfessional();
    }
  }

  onDatepickerChange(event: MatDatepickerInputEvent<Date>): void {
    const date = event.value;
    if (!date) return;

    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);
    this.selectedDate.set(selected);
    this.loadSlots(formatDateOnly(selected));
  }

  close(): void {
    this.dialogRef.close();
  }

  acceptConfirmation(): void {
    this.dialogRef.close({
      success: true,
      confirmation: this.bookingConfirmation(),
    });
  }

  bookSlot(slot: SlotDto): void {
    if (this.isBooking()) return;

    const professionalId = this.professionalId();
    const selectedDate = this.selectedDate();

    if (!professionalId || !selectedDate) {
      this.bookingError.set('No pudimos tomar la cita. Inténtalo de nuevo.');
      return;
    }

    this.isBooking.set(true);
    this.bookingError.set(null);

    const dto: CreateAppointmentDto = {
      professionalProfileId: professionalId,
      date: formatDateOnly(selectedDate),
      slotId: slot.id,
      appointmentDate: formatDateOnly(selectedDate),
      timeSlot: `${slot.startTime}`,
    };

    this.appointmentsService.createAppointment(dto).subscribe({
      next: () => {
        const dateLabel = selectedDate.toLocaleDateString('es-HN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        this.bookingConfirmation.set({
          date: dateLabel,
          startTime: slot.startTime,
          endTime: slot.endTime,
          location:
            slot.professionalLocationName ??
            slot.professionalLocationAddress ??
            'Consultorio privado',
        });
        this.isBooking.set(false);
      },
      error: () => {
        this.bookingError.set('No pudimos tomar la cita. Inténtalo de nuevo.');
        this.isBooking.set(false);
      },
    });
  }

  private loadProfessional(): void {
    this.loadingProfile.set(true);
    this.profileError.set(null);

    this.publicApi.getProfilePage(this.data.slug).subscribe({
      next: (response) => {
        const profile = response.profile;
        this.professionalId.set(profile?.id ?? '');
        this.professionalName.set(profile?.businessName ?? 'Profesional');
        this.imageUrl.set(profile?.profileImageUrl ?? '');

        const names = [
          profile?.categoryName,
          ...(response.services ?? []).map((service) => service.name),
        ].filter((x): x is string => !!x && !!x.trim());
        this.specialties.set([...new Set(names)].slice(0, 4));

        this.loadingProfile.set(false);
      },
      error: () => {
        this.profileError.set('No se pudo cargar la información del médico.');
        this.loadingProfile.set(false);
      },
    });
  }

  private loadSlots(dateValue: string): void {
    const professionalId = this.professionalId();
    if (!professionalId) {
      this.slotsError.set('No se pudo identificar el médico seleccionado.');
      return;
    }

    this.loadingSlots.set(true);
    this.slotsError.set(null);
    this.availableSlots.set([]);

    this.slotsService.getSlots(professionalId, dateValue).subscribe({
      next: (response) => {
        this.availableSlots.set(
          (response.slots ?? []).filter(
            (slot) =>
              slot.isAvailable && !isSlotInPast(dateValue, slot.startTime),
          ),
        );
        this.loadingSlots.set(false);
      },
      error: (error: ApiError) => {
        this.slotsError.set(getUserMessage(error));
        this.loadingSlots.set(false);
      },
    });
  }

  private getTodayDate(): Date {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }
}
