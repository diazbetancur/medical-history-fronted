import { Routes } from '@angular/router';

export const specialtiesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./specialties.page').then((m) => m.SpecialtiesPageComponent),
    title: 'Especialidades - Admin',
  },
];
