import { Routes } from '@angular/router';

export const rolesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./roles.page').then((m) => m.RolesPageComponent),
    title: 'Roles - Admin',
  },
  {
    path: ':id/permissions',
    loadComponent: () =>
      import('./role-permissions.page').then(
        (m) => m.RolePermissionsPageComponent,
      ),
    title: 'Permisos del Rol - Admin',
  },
];
