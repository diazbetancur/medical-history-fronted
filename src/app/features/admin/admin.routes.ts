import { Routes } from '@angular/router';
import { adminGuard, authGuard, routeData } from '@core/auth';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    data: routeData('admin'),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin-home/admin-home.page').then(
            (m) => m.AdminHomePageComponent
          ),
        title: 'Admin Panel - ProDirectory',
      },
      {
        path: 'professionals',
        loadComponent: () =>
          import('./pages/professionals-review/professionals-review.page').then(
            (m) => m.ProfessionalsReviewPageComponent
          ),
        title: 'Revisar Profesionales - Admin',
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('./pages/requests/requests.page').then(
            (m) => m.AdminRequestsPageComponent
          ),
        title: 'Gestión de Solicitudes - Admin',
      },
    ],
  },
];
