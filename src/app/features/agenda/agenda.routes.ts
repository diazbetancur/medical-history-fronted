import { Routes } from '@angular/router';
import { authStoreGuard } from '@core/auth';

/**
 * Agenda/Appointments Routes
 *
 * Protected routes for appointment management.
 * All routes require authentication.
 *
 * Structure:
 * - /dashboard/agenda → List of appointments
 * - /dashboard/agenda/book → Book new appointment
 * - /dashboard/agenda/confirm → Confirm appointment (with token)
 * - /dashboard/agenda/:id → Appointment details
 */
export const agendaRoutes: Routes = [
  {
    path: '',
    canActivate: [authStoreGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/appointments-list/appointments-list.page').then(
            (m) => m.AppointmentsListPageComponent,
          ),
        title: 'Mis Citas - ProDirectory',
      },
      {
        path: 'book',
        loadComponent: () =>
          import('./pages/book-appointment/book-appointment.page').then(
            (m) => m.BookAppointmentPageComponent,
          ),
        title: 'Agendar Cita - ProDirectory',
      },
      {
        path: 'confirm',
        loadComponent: () =>
          import('./pages/confirm-appointment/confirm-appointment.page').then(
            (m) => m.ConfirmAppointmentPageComponent,
          ),
        title: 'Confirmar Cita - ProDirectory',
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/appointment-detail/appointment-detail.page').then(
            (m) => m.AppointmentDetailPageComponent,
          ),
        title: 'Detalle de Cita - ProDirectory',
      },
    ],
  },
];
