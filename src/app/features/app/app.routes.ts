import { Routes } from '@angular/router';
import {
  authGuard,
  professionalGuard,
  routeData,
} from '@core/auth';
import { AppLayoutComponent } from './layouts/app-layout/app-layout.component';

export const appRoutes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard, professionalGuard],
    data: routeData('professional'),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard-home/dashboard-home.page').then(
            (m) => m.DashboardHomePageComponent
          ),
        title: 'Dashboard - ProDirectory',
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('./pages/requests/requests.page').then(
            (m) => m.RequestsPageComponent
          ),
        title: 'Solicitudes - ProDirectory',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile-edit/profile-edit.page').then(
            (m) => m.ProfileEditPageComponent
          ),
        title: 'Editar Perfil - ProDirectory',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.page').then(
            (m) => m.SettingsPageComponent
          ),
        title: 'Configuración - ProDirectory',
      },
    ],
  },
];
