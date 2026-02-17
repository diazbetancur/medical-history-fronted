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
import { SlotDto } from '@patient/models/slot.dto';
import { SlotsService } from '@patient/services/slots.service';

export interface BookAppointmentDialogData {
  slug: string;
  professionalId?: string;
  name?: string;
  imageUrl?: string;
  specialties?: string[];
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
              <div class="slot-item">
                {{ slot.startTime }} - {{ slot.endTime }}
              </div>
            }
          </div>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
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
        padding: 10px;
        border: 1px solid var(--color-border);
        border-radius: 8px;
        text-align: center;
        font-weight: 500;
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
  private readonly dialogRef = inject(
    MatDialogRef<BookAppointmentDialogComponent>,
  );
  readonly data = inject<BookAppointmentDialogData>(MAT_DIALOG_DATA);

  readonly loadingProfile = signal(false);
  readonly loadingSlots = signal(false);
  readonly profileError = signal<string | null>(null);
  readonly slotsError = signal<string | null>(null);

  readonly professionalId = signal(this.data.professionalId ?? '');
  readonly professionalName = signal(this.data.name ?? 'Profesional');
  readonly imageUrl = signal(this.data.imageUrl ?? '');
  readonly specialties = signal<string[]>(this.data.specialties ?? []);

  readonly selectedDate = signal<Date | null>(null);
  readonly availableSlots = signal<SlotDto[]>([]);

  readonly minDate = this.getTomorrowDate();

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
          (response.slots ?? []).filter((slot) => slot.isAvailable),
        );
        this.loadingSlots.set(false);
      },
      error: (error: ApiError) => {
        this.slotsError.set(getUserMessage(error));
        this.loadingSlots.set(false);
      },
    });
  }

  private getTomorrowDate(): Date {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
}
