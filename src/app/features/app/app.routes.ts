import { Routes } from '@angular/router';
import { authGuard, routeData, uiProfileProfessionalGuard } from '@core/auth';
import { ProfessionalShellComponent } from '../professional/layouts/professional-shell.component';

/**
 * App Routes (Professional Area / Dashboard)
 *
 * Protected by:
 * - authGuard: Ensures user is authenticated
 * - uiProfileProfessionalGuard: UX guard - redirects non-professional profiles
 * - ProfessionalShellComponent: Layout wrapper with navigation menu
 *
 * **Note:** This routes professional users to their dashboard area.
 * The uiProfileProfessionalGuard checks the computed UiProfile and redirects
 * if the user doesn't have PROFESIONAL profile (UX layer, not security).
 */
export const appRoutes: Routes = [
  {
    path: '',
    component: ProfessionalShellComponent,
    canActivate: [authGuard, uiProfileProfessionalGuard],
    data: routeData('professional'),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard-home/dashboard-home.page').then(
            (m) => m.DashboardHomePageComponent,
          ),
        title: 'Dashboard - ProDirectory',
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('./pages/requests/requests.page').then(
            (m) => m.RequestsPageComponent,
          ),
        title: 'Solicitudes - ProDirectory',
      },
      {
        path: 'agenda',
        loadChildren: () =>
          import('../agenda/agenda.routes').then((m) => m.agendaRoutes),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile-edit/profile-edit.page').then(
            (m) => m.ProfileEditPageComponent,
          ),
        title: 'Editar Perfil - ProDirectory',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.page').then(
            (m) => m.SettingsPageComponent,
          ),
        title: 'Configuración - ProDirectory',
      },
    ],
  },
];
