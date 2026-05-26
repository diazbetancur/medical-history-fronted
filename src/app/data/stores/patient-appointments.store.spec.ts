import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AppointmentsApi } from '@data/api/appointments.api';
import { ProfessionalAvailabilityApi } from '@data/api/professional-availability.api';
import type { SlotItemDto, SlotResponseDto } from '@data/models/availability.models';
import { SlotPreferencesService } from '@patient/services/slot-preferences.service';
import { ToastService } from '@shared/services';
import { PatientAppointmentsStore } from './patient-appointments.store';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSlot(): SlotItemDto {
  return {
    startLocal: '2026-05-25T09:00:00',
    endLocal:   '2026-05-25T09:30:00',
    startUtc:   '2026-05-25T14:00:00Z',
    endUtc:     '2026-05-25T14:30:00Z',
    professionalLocationId:      null,
    professionalLocationName:    null,
    professionalLocationAddress: null,
  };
}

function makeSlotResponse(items: SlotItemDto[]): SlotResponseDto {
  return { date: '2026-05-25', timeZone: 'UTC', slotMinutes: 30, totalSlots: items.length, items };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PatientAppointmentsStore', () => {
  let store: PatientAppointmentsStore;
  let appointmentsApi:  jasmine.SpyObj<AppointmentsApi>;
  let availabilityApi:  jasmine.SpyObj<ProfessionalAvailabilityApi>;
  let slotPreferences:  jasmine.SpyObj<SlotPreferencesService>;
  let toastService:     jasmine.SpyObj<ToastService>;
  let router:           jasmine.SpyObj<Router>;

  beforeEach(() => {
    appointmentsApi = jasmine.createSpyObj('AppointmentsApi',            ['createAppointment']);
    availabilityApi = jasmine.createSpyObj('ProfessionalAvailabilityApi', ['getGeneratedSlots']);
    slotPreferences = jasmine.createSpyObj('SlotPreferencesService',     ['getDurationMinutes', 'setDurationMinutes']);
    toastService    = jasmine.createSpyObj('ToastService',               ['error', 'success', 'warning', 'info']);
    router          = jasmine.createSpyObj('Router',                     ['navigate']);

    slotPreferences.getDurationMinutes.and.returnValue(30);

    TestBed.configureTestingModule({
      providers: [
        PatientAppointmentsStore,
        { provide: AppointmentsApi,            useValue: appointmentsApi },
        { provide: ProfessionalAvailabilityApi, useValue: availabilityApi },
        { provide: SlotPreferencesService,     useValue: slotPreferences },
        { provide: ToastService,               useValue: toastService },
        { provide: Router,                     useValue: router },
      ],
    });

    store = TestBed.inject(PatientAppointmentsStore);
  });

  // ── initializeAppointmentFlow ───────────────────────────────────────────────

  describe('initializeAppointmentFlow', () => {
    it('sets professionalId and professionalName', () => {
      store.initializeAppointmentFlow('prof-123', 'Dr. García');
      expect(store.professionalId()).toBe('prof-123');
      expect(store.professionalName()).toBe('Dr. García');
    });

    it('uses the provided durationMinutes when given', () => {
      store.initializeAppointmentFlow('prof-1', 'Dr. X', 60);
      expect(store.durationMinutes()).toBe(60);
    });

    it('falls back to SlotPreferencesService duration when not provided', () => {
      slotPreferences.getDurationMinutes.and.returnValue(45);
      store.initializeAppointmentFlow('prof-1', 'Dr. X');
      expect(store.durationMinutes()).toBe(45);
    });

    it('clears selectedDate, selectedSlot, availableSlots and lastError', () => {
      store.initializeAppointmentFlow('prof-1', 'Dr. X');
      availabilityApi.getGeneratedSlots.and.returnValue(of(makeSlotResponse([makeSlot()])));
      store.loadAvailableSlots('2026-05-25');

      store.initializeAppointmentFlow('prof-2', 'Dr. Y');

      expect(store.selectedDate()).toBe('');
      expect(store.selectedSlot()).toBeNull();
      expect(store.availableSlots()).toEqual([]);
    });
  });

  // ── loadAvailableSlots ──────────────────────────────────────────────────────

  describe('loadAvailableSlots', () => {
    it('shows error toast and returns early when no professionalId is set', () => {
      store.loadAvailableSlots('2026-05-25');

      expect(toastService.error).toHaveBeenCalledWith(
        jasmine.stringContaining('profesional'),
      );
      expect(availabilityApi.getGeneratedSlots).not.toHaveBeenCalled();
    });

    it('clears slots before calling API (M-04: no stale data during load)', () => {
      store.initializeAppointmentFlow('prof-1', 'Dr. X');
      availabilityApi.getGeneratedSlots.and.returnValue(of(makeSlotResponse([makeSlot()])));
      store.loadAvailableSlots('2026-05-25');

      let slotsAtCallTime: SlotItemDto[] = [makeSlot()];
      availabilityApi.getGeneratedSlots.and.callFake(() => {
        slotsAtCallTime = store.availableSlots();
        return of(makeSlotResponse([]));
      });

      store.loadAvailableSlots('2026-05-26');
      expect(slotsAtCallTime).toEqual([]);
    });

    it('sets availableSlots on success', () => {
      store.initializeAppointmentFlow('prof-1', 'Dr. X');
      const slots = [makeSlot(), makeSlot()];
      availabilityApi.getGeneratedSlots.and.returnValue(of(makeSlotResponse(slots)));

      store.loadAvailableSlots('2026-05-25');

      expect(store.availableSlots()).toEqual(slots);
      expect(store.isLoading()).toBeFalse();
    });

    it('shows info toast when no slots are returned', () => {
      store.initializeAppointmentFlow('prof-1', 'Dr. X');
      availabilityApi.getGeneratedSlots.and.returnValue(of(makeSlotResponse([])));

      store.loadAvailableSlots('2026-05-25');

      expect(toastService.info).toHaveBeenCalledWith(
        jasmine.stringContaining('horarios disponibles'),
      );
    });

    it('clears slots and shows error toast on API failure', () => {
      store.initializeAppointmentFlow('prof-1', 'Dr. X');
      const errorResponse = { error: { title: 'Error de servidor' } };
      availabilityApi.getGeneratedSlots.and.returnValue(throwError(() => errorResponse));

      store.loadAvailableSlots('2026-05-25');

      expect(store.availableSlots()).toEqual([]);
      expect(store.isLoading()).toBeFalse();
      expect(toastService.error).toHaveBeenCalledWith('Error de servidor');
    });
  });

  // ── selectSlot ──────────────────────────────────────────────────────────────

  describe('selectSlot', () => {
    it('sets selectedSlot', () => {
      const slot = makeSlot();
      store.selectSlot(slot);
      expect(store.selectedSlot()).toBe(slot);
    });
  });

  // ── computed: hasAvailableSlots ─────────────────────────────────────────────

  describe('hasAvailableSlots', () => {
    it('returns false when no slots are loaded', () => {
      expect(store.hasAvailableSlots()).toBeFalse();
    });

    it('returns true when slots are present', () => {
      store.initializeAppointmentFlow('prof-1', 'Dr. X');
      availabilityApi.getGeneratedSlots.and.returnValue(
        of(makeSlotResponse([makeSlot()])),
      );
      store.loadAvailableSlots('2026-05-25');
      expect(store.hasAvailableSlots()).toBeTrue();
    });
  });

  // ── computed: canCreateAppointment ──────────────────────────────────────────

  describe('canCreateAppointment', () => {
    it('returns false when no slot is selected', () => {
      store.initializeAppointmentFlow('prof-1', 'Dr. X');
      expect(store.canCreateAppointment()).toBeFalse();
    });

    it('returns true when slot, date and professionalId are set', () => {
      store.initializeAppointmentFlow('prof-1', 'Dr. X');
      availabilityApi.getGeneratedSlots.and.returnValue(
        of(makeSlotResponse([makeSlot()])),
      );
      store.loadAvailableSlots('2026-05-25');
      store.selectSlot(makeSlot());
      expect(store.canCreateAppointment()).toBeTrue();
    });
  });

  // ── createAppointment ───────────────────────────────────────────────────────

  describe('createAppointment', () => {
    beforeEach(() => {
      store.initializeAppointmentFlow('prof-1', 'Dr. X');
      availabilityApi.getGeneratedSlots.and.returnValue(
        of(makeSlotResponse([makeSlot()])),
      );
      store.loadAvailableSlots('2026-05-25');
      store.selectSlot(makeSlot());
    });

    it('shows error toast when called without a selected slot', () => {
      store.initializeAppointmentFlow('prof-new', 'Dr. New');

      store.createAppointment();

      expect(toastService.error).toHaveBeenCalledWith(
        jasmine.stringContaining('selecciona'),
      );
      expect(appointmentsApi.createAppointment).not.toHaveBeenCalled();
    });

    it('navigates and shows success toast on creation success', () => {
      appointmentsApi.createAppointment.and.returnValue(
        of({ appointmentId: 'appt-1', confirmationToken: 'tok' } as any),
      );

      store.createAppointment('Nota de prueba');

      expect(toastService.success).toHaveBeenCalledWith(
        jasmine.stringContaining('Cita creada'),
      );
      expect(router.navigate).toHaveBeenCalledWith(['/patient/appointments']);
      expect(appointmentsApi.createAppointment).toHaveBeenCalledWith(
        jasmine.objectContaining({ professionalId: 'prof-1', startTime: '2026-05-25T14:00:00Z' }),
      );
    });

    it('resets state after successful creation', () => {
      appointmentsApi.createAppointment.and.returnValue(of({} as any));

      store.createAppointment();

      expect(store.selectedSlot()).toBeNull();
      expect(store.availableSlots()).toEqual([]);
      expect(store.professionalId()).toBe('');
    });

    it('shows specific toast and reloads slots on TIME_SLOT_UNAVAILABLE error', () => {
      const error = { error: { errorCode: 'TIME_SLOT_UNAVAILABLE', title: 'Slot taken' } };
      appointmentsApi.createAppointment.and.returnValue(throwError(() => error));
      availabilityApi.getGeneratedSlots.and.returnValue(of(makeSlotResponse([makeSlot()])));

      store.createAppointment();

      expect(toastService.error).toHaveBeenCalledWith(
        jasmine.stringContaining('09:00'),
      );
      // Slots should reload: 1 in beforeEach + 1 reload
      expect(availabilityApi.getGeneratedSlots).toHaveBeenCalledTimes(2);
    });

    it('shows generic error toast for non-slot-conflict errors', () => {
      const error = { error: { errorCode: 'SERVER_ERROR', title: 'Internal Server Error' } };
      appointmentsApi.createAppointment.and.returnValue(throwError(() => error));

      store.createAppointment();

      expect(toastService.error).toHaveBeenCalledWith('Internal Server Error');
      expect(store.isCreating()).toBeFalse();
    });
  });

  // ── resetState ──────────────────────────────────────────────────────────────

  describe('resetState', () => {
    it('clears all state', () => {
      store.initializeAppointmentFlow('prof-1', 'Dr. X');
      store.selectSlot(makeSlot());

      store.resetState();

      expect(store.professionalId()).toBe('');
      expect(store.professionalName()).toBe('');
      expect(store.selectedDate()).toBe('');
      expect(store.selectedSlot()).toBeNull();
      expect(store.availableSlots()).toEqual([]);
      expect(store.lastError()).toBeNull();
    });
  });

  // ── clearError ───────────────────────────────────────────────────────────────

  describe('clearError', () => {
    it('sets lastError to null', () => {
      store.initializeAppointmentFlow('prof-1', 'Dr. X');
      const errorResponse = { error: { title: 'Fail' } };
      availabilityApi.getGeneratedSlots.and.returnValue(throwError(() => errorResponse));
      store.loadAvailableSlots('2026-05-25');

      store.clearError();

      expect(store.lastError()).toBeNull();
    });
  });
});
