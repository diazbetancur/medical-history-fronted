import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';

export const publicRoutes: Routes = [
  {
    path: '',
    component: PublicLayoutComponent,
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
            (m) => m.SearchPageComponent
          ),
        title: 'Buscar Profesionales - ProDirectory',
      },
      {
        path: 'pro/:slug',
        loadComponent: () =>
          import('./pages/profile/profile.page').then(
            (m) => m.ProfilePageComponent
          ),
        title: 'Perfil Profesional - ProDirectory',
      },
    ],
  },
];
