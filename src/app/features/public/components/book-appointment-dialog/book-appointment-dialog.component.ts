import { Component, computed, inject, signal } from '@angular/core';
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
import { Router } from '@angular/router';
import { ApiError, getUserMessage } from '@core/http/api-error';
import { formatDateOnly } from '@core/http/http-utils';
import { PublicApi } from '@data/api';
import { CreateAppointmentDto } from '@patient/models/appointment.dto';
import { isSlotInPast, SlotDto } from '@patient/models/slot.dto';
import { AppointmentsService } from '@patient/services/appointments.service';
import { ActingPatientStore } from '@patient/services/acting-patient.store';
import { FamilyGroupService } from '@patient/services/family-group.service';
import { SlotsService } from '@patient/services/slots.service';
import { DoctorNamePipe } from '@shared/pipes/doctor-name.pipe';

export interface BookAppointmentDialogData {
  slug: string;
  professionalId?: string;
  name?: string;
  imageUrl?: string;
  specialties?: string[];
  patientProfileId?: string;
  patientName?: string;
}

interface BookingConfirmation {
  date: string;
  startTime: string;
  endTime: string;
  location: string;
}

const OBSERVATION_MIN_NON_WHITESPACE = 10;

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
    DoctorNamePipe,
  ],
  templateUrl: './book-appointment-dialog.component.html',
  styleUrl: './book-appointment-dialog.component.scss',
})
export class BookAppointmentDialogComponent {
  private readonly publicApi = inject(PublicApi);
  private readonly slotsService = inject(SlotsService);
  private readonly appointmentsService = inject(AppointmentsService);
  private readonly familyGroup = inject(FamilyGroupService);
  private readonly actingStore = inject(ActingPatientStore);
  private readonly dialogRef = inject(
    MatDialogRef<BookAppointmentDialogComponent>,
  );
  private readonly router = inject(Router);
  readonly data = inject<BookAppointmentDialogData>(MAT_DIALOG_DATA);

  private readonly actingPatientId = computed(
    () => this.data?.patientProfileId ?? this.actingStore.acting()?.patientProfileId ?? null,
  );
  readonly actingPatientName = computed(
    () => this.data?.patientName ?? this.actingStore.acting()?.fullName ?? null,
  );

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
  readonly observation = signal('');
  readonly observationTouched = signal(false);
  readonly observationNonWhitespaceLength = computed(() =>
    this.countNonWhitespace(this.observation()),
  );
  readonly isObservationValid = computed(
    () =>
      this.observationNonWhitespaceLength() >= OBSERVATION_MIN_NON_WHITESPACE,
  );
  readonly showObservationError = computed(
    () => this.observationTouched() && !this.isObservationValid(),
  );
  readonly pendingSlot = signal<SlotDto | null>(null);

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
    this.pendingSlot.set(null);
    this.loadSlots(formatDateOnly(selected));
  }

  onObservationInput(value: string): void {
    this.observation.set(value);
    this.bookingError.set(null);
  }

  markObservationTouched(): void {
    this.observationTouched.set(true);
  }

  close(): void {
    this.dialogRef.close();
  }

  acceptConfirmation(): void {
    this.dialogRef.close({
      success: true,
      confirmation: this.bookingConfirmation(),
    });
    const actingId = this.actingPatientId();
    if (actingId) {
      void this.router.navigate(['/patient/managed', actingId]);
    } else {
      void this.router.navigate(['/patient/appointments']);
    }
  }

  selectSlot(slot: SlotDto): void {
    if (this.isBooking()) return;
    this.pendingSlot.set(slot);
    this.bookingError.set(null);
    if (!this.isObservationValid()) {
      this.observationTouched.set(true);
    }
  }

  confirmSlot(): void {
    const slot = this.pendingSlot();
    if (!slot || this.isBooking()) return;

    const observation = this.getTrimmedObservation();
    const professionalId = this.professionalId();
    const selectedDate = this.selectedDate();

    this.observationTouched.set(true);

    if (!this.isObservationValid()) {
      this.bookingError.set(
        'El motivo de la consulta debe tener al menos 10 caracteres que no sean espacios.',
      );
      return;
    }

    if (!professionalId || !selectedDate) {
      this.bookingError.set('No pudimos tomar la cita. Inténtalo de nuevo.');
      return;
    }

    this.isBooking.set(true);
    this.bookingError.set(null);

    const appointmentDate = formatDateOnly(selectedDate);
    const actingId = this.actingPatientId();

    const request$ = actingId
      ? this.familyGroup.bookAppointment(actingId, {
          professionalProfileId: professionalId,
          appointmentDate,
          timeSlot: `${slot.startTime}`,
          observation,
        })
      : this.appointmentsService.createAppointment({
          professionalProfileId: professionalId,
          date: appointmentDate,
          slotId: slot.id,
          appointmentDate,
          timeSlot: `${slot.startTime}`,
          observation,
        } satisfies CreateAppointmentDto);

    request$.subscribe({
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
        ].filter((value): value is string => !!value && !!value.trim());
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

  private getTrimmedObservation(): string {
    return this.observation().trim();
  }

  private countNonWhitespace(value: string): number {
    return value.replace(/\s/g, '').length;
  }
}
