import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { AuthStore } from '@core/auth/auth.store';
import { ProfessionalAppointmentsApi } from '@data/api/professional-appointments.api';
import { ProfessionalAppointmentsStore } from '@data/stores/professional-appointments.store';
import { ToastService } from '@shared/services';

import { ProfessionalAppointmentsPage } from './professional-appointments.page';

// ── helpers ───────────────────────────────────────────────────────────────────

/** Minimal user with professionalProfileId */
const MOCK_USER = {
  id: 'user-1',
  email: 'prof@example.com',
  professionalProfileId: 'prof-profile-1',
  permissions: ['Appointments.Create', 'Appointments.Update', 'Appointments.Cancel'],
  contexts: [],
};

/**
 * Build a page instance with fully-controlled spies.
 * Pass `overrides` to change individual spy behaviours per test.
 */
function buildPage(overrides: {
  permissions?: string[];
  professionalProfileId?: string | null;
} = {}) {
  const permissions = overrides.permissions ?? MOCK_USER.permissions;
  const professionalId = overrides.hasOwnProperty('professionalProfileId')
    ? overrides.professionalProfileId
    : MOCK_USER.professionalProfileId;

  const authStore = jasmine.createSpyObj<AuthStore>('AuthStore', ['hasPermission'], {
    user: signal({ ...MOCK_USER, professionalProfileId: professionalId } as any),
    userPermissions: signal(permissions),
  });
  authStore.hasPermission.and.callFake((p: string) => permissions.includes(p));

  const store = jasmine.createSpyObj<ProfessionalAppointmentsStore>(
    'ProfessionalAppointmentsStore',
    [
      'loadUpcomingAppointments',
      'confirmAppointment',
      'cancelAppointment',
      'completeAppointment',
      'markAsNoShow',
    ],
    {
      appointmentsByDate: signal({}),
      upcomingAppointments: signal([]),
      isLoading: signal(false),
    },
  );

  const appointmentsApi = jasmine.createSpyObj<ProfessionalAppointmentsApi>(
    'ProfessionalAppointmentsApi',
    ['getAppointments'],
  );
  appointmentsApi.getAppointments.and.returnValue(
    of({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 } as any),
  );

  const toast = jasmine.createSpyObj<ToastService>('ToastService', [
    'error', 'success', 'warning', 'info',
  ]);

  const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
  const dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
  const route = {
    snapshot: { queryParamMap: { get: () => null } },
  } as unknown as ActivatedRoute;

  TestBed.configureTestingModule({
    providers: [
      ProfessionalAppointmentsPage,
      { provide: AuthStore, useValue: authStore },
      { provide: ProfessionalAppointmentsStore, useValue: store },
      { provide: ProfessionalAppointmentsApi, useValue: appointmentsApi },
      { provide: ToastService, useValue: toast },
      { provide: Router, useValue: router },
      { provide: MatDialog, useValue: dialog },
      { provide: ActivatedRoute, useValue: route },
    ],
  });

  const page = TestBed.inject(ProfessionalAppointmentsPage);
  return { page, authStore, store, appointmentsApi, toast, router, dialog };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ProfessionalAppointmentsPage', () => {

  beforeEach(() => TestBed.configureTestingModule({}));

  // ── confirmAppointment (I-10) ─────────────────────────────────────────────

  describe('confirmAppointment', () => {
    it('delegates to store when user has Appointments.Update permission', () => {
      const { page, store } = buildPage();
      (page as any).confirmAppointment('appt-1');
      expect(store.confirmAppointment).toHaveBeenCalledOnceWith('appt-1');
    });

    it('shows error toast and does NOT call store when permission is missing', () => {
      const { page, store, toast } = buildPage({
        permissions: [], // no permissions
      });
      (page as any).confirmAppointment('appt-1');
      expect(store.confirmAppointment).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledOnceWith(
        jasmine.stringContaining('permiso'),
      );
    });
  });

  // ── cancelAppointment (I-10) ──────────────────────────────────────────────

  describe('cancelAppointment', () => {
    it('delegates to store when user has Appointments.Cancel permission', () => {
      const { page, store } = buildPage();
      (page as any).cancelAppointment('appt-2');
      expect(store.cancelAppointment).toHaveBeenCalledOnceWith('appt-2');
    });

    it('shows error toast and does NOT call store when permission is missing', () => {
      const { page, store, toast } = buildPage({
        permissions: ['Appointments.Update'], // missing Cancel
      });
      (page as any).cancelAppointment('appt-2');
      expect(store.cancelAppointment).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledOnceWith(
        jasmine.stringContaining('permiso'),
      );
    });
  });

  // ── completeAppointment (I-10) ────────────────────────────────────────────

  describe('completeAppointment', () => {
    it('delegates to store when user has Appointments.Update permission', () => {
      const { page, store } = buildPage();
      (page as any).completeAppointment('appt-3');
      expect(store.completeAppointment).toHaveBeenCalledOnceWith('appt-3');
    });

    it('shows error toast and does NOT call store when permission is missing', () => {
      const { page, store, toast } = buildPage({ permissions: [] });
      (page as any).completeAppointment('appt-3');
      expect(store.completeAppointment).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledOnceWith(
        jasmine.stringContaining('permiso'),
      );
    });
  });

  // ── markAsNoShow (I-10) ───────────────────────────────────────────────────

  describe('markAsNoShow', () => {
    it('delegates to store when user has Appointments.Update permission', () => {
      const { page, store } = buildPage();
      (page as any).markAsNoShow('appt-4');
      expect(store.markAsNoShow).toHaveBeenCalledOnceWith('appt-4');
    });

    it('shows error toast and does NOT call store when permission is missing', () => {
      const { page, store, toast } = buildPage({ permissions: [] });
      (page as any).markAsNoShow('appt-4');
      expect(store.markAsNoShow).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledOnceWith(
        jasmine.stringContaining('permiso'),
      );
    });
  });

  // ── openAddExternalDialog (I-10) ──────────────────────────────────────────

  describe('openAddExternalDialog', () => {
    it('opens dialog when user has Appointments.Create permission and professionalProfileId', () => {
      const { page, dialog } = buildPage();
      const dialogRef = { afterClosed: () => of(null) } as any;
      dialog.open.and.returnValue(dialogRef);

      (page as any).openAddExternalDialog();

      expect(dialog.open).toHaveBeenCalledTimes(1);
    });

    it('shows error and does NOT open dialog when Appointments.Create permission is missing', () => {
      const { page, dialog, toast } = buildPage({ permissions: [] });

      (page as any).openAddExternalDialog();

      expect(dialog.open).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledOnceWith(
        jasmine.stringContaining('permiso'),
      );
    });

    it('shows error and does NOT open dialog when professionalProfileId is missing', () => {
      const { page, dialog, toast } = buildPage({
        professionalProfileId: null,
      });

      (page as any).openAddExternalDialog();

      expect(dialog.open).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledOnceWith(
        jasmine.stringContaining('perfil profesional'),
      );
    });

    it('refreshes upcoming appointments after dialog closes with a result', () => {
      const { page, store, dialog } = buildPage();
      const created = { id: 'new-appt' } as any;
      const dialogRef = { afterClosed: () => of(created) } as any;
      dialog.open.and.returnValue(dialogRef);

      (page as any).openAddExternalDialog();

      expect(store.loadUpcomingAppointments).toHaveBeenCalled();
    });

    it('does NOT refresh upcoming appointments when dialog is cancelled (null result)', () => {
      const { page, store, dialog } = buildPage();
      const dialogRef = { afterClosed: () => of(null) } as any;
      dialog.open.and.returnValue(dialogRef);

      store.loadUpcomingAppointments.calls.reset(); // clear ngOnInit call
      (page as any).openAddExternalDialog();

      // loadUpcomingAppointments called in ngOnInit but NOT again after null close
      expect(store.loadUpcomingAppointments).not.toHaveBeenCalled();
    });
  });

  // ── applyDateRangeFilter ──────────────────────────────────────────────────

  describe('applyDateRangeFilter', () => {
    it('shows warning when from date is missing', () => {
      const { page, appointmentsApi, toast } = buildPage();
      (page as any).rangeFrom.set('');
      (page as any).rangeTo.set('2026-06-01');

      (page as any).applyDateRangeFilter();

      expect(toast.warning).toHaveBeenCalledOnceWith(
        jasmine.stringContaining('fecha'),
      );
      expect(appointmentsApi.getAppointments).not.toHaveBeenCalled();
    });

    it('shows warning when from > to', () => {
      const { page, appointmentsApi, toast } = buildPage();
      (page as any).rangeFrom.set('2026-06-10');
      (page as any).rangeTo.set('2026-06-01');

      (page as any).applyDateRangeFilter();

      expect(toast.warning).toHaveBeenCalledOnceWith(
        jasmine.stringContaining('mayor'),
      );
      expect(appointmentsApi.getAppointments).not.toHaveBeenCalled();
    });

    it('calls API with correct dates when range is valid', () => {
      const { page, appointmentsApi } = buildPage();
      (page as any).rangeFrom.set('2026-06-01');
      (page as any).rangeTo.set('2026-06-07');

      (page as any).applyDateRangeFilter();

      expect(appointmentsApi.getAppointments).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({ from: '2026-06-01', to: '2026-06-07' }),
      );
    });
  });

  // ── getStatusLabel ────────────────────────────────────────────────────────

  describe('getStatusLabel', () => {
    const cases: Array<[string, string]> = [
      ['PENDING', 'Pendiente'],
      ['CONFIRMED', 'Confirmada'],
      ['RESCHEDULED', 'Reprogramada'],
      ['CANCELLED', 'Cancelada'],
      ['COMPLETED', 'Completada'],
      ['NO_SHOW', 'No asistió'],
    ];

    cases.forEach(([status, expected]) => {
      it(`returns "${expected}" for status ${status}`, () => {
        const { page } = buildPage();
        expect((page as any).getStatusLabel(status as any)).toBe(expected);
      });
    });
  });

  describe('canMarkAttendance', () => {
    it('allows confirmed and rescheduled appointments', () => {
      const { page } = buildPage();
      expect(
        (page as any).canMarkAttendance({ status: 'CONFIRMED' } as any),
      ).toBeTrue();
      expect(
        (page as any).canMarkAttendance({ status: 'RESCHEDULED' } as any),
      ).toBeTrue();
    });

    it('rejects statuses outside attendance flow', () => {
      const { page } = buildPage();
      expect(
        (page as any).canMarkAttendance({ status: 'PENDING' } as any),
      ).toBeFalse();
    });
  });
});
