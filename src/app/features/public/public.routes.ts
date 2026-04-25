import { Routes } from '@angular/router';
import { PublicShellComponent } from './layouts/public-shell.component';

/**
 * Public Routes
 *
 * Accessible to all users (authenticated or not).
 * Uses PublicShellComponent for consistent layout.
 *
 * **Note:** No guards required - public area is accessible to everyone.
 */
export const publicRoutes: Routes = [
  // Offline page (no layout, standalone)
  {
    path: 'offline',
    loadComponent: () =>
      import('./pages/offline/offline.page').then(
        (m) => m.OfflinePageComponent,
      ),
    title: 'Sin Conexión - ProDirectory',
  },
  {
    path: '',
    component: PublicShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/home/home.page').then((m) => m.HomePageComponent),
        title: 'ProDirectory - Encuentra Profesionales de Confianza',
      },
      {
        path: 'search',
        loadComponent: () =>
          import('./pages/search/search.page').then(
            (m) => m.SearchPageComponent,
          ),
        title: 'Buscar Profesionales - ProDirectory',
      },
      {
        path: 'pro/:slug',
        loadComponent: () =>
          import('./pages/profile/profile.page').then(
            (m) => m.ProfilePageComponent,
          ),
        title: 'Perfil Profesional - ProDirectory',
      },
    ],
  },
];
