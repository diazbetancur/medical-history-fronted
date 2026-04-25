import { Routes } from '@angular/router';

export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./users.page').then((m) => m.UsersPageComponent),
    title: 'Usuarios - Admin',
  },
];
