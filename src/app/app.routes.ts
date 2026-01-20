import { Routes } from '@angular/router';

export const routes: Routes = [
  // Public routes (SSR optimized)
  {
    path: '',
    loadChildren: () =>
      import('@features/public/public.routes').then((m) => m.publicRoutes),
  },

  // Login page (standalone, no layout)
  {
    path: 'login',
    loadComponent: () =>
      import('@features/app/pages/login/login.page').then(
        (m) => m.LoginPageComponent
      ),
    title: 'Iniciar Sesión - ProDirectory',
  },

  // Dashboard routes (CSR, requires auth)
  {
    path: 'dashboard',
    loadChildren: () =>
      import('@features/app/app.routes').then((m) => m.appRoutes),
  },

  // Admin routes (CSR, requires auth + admin role)
  {
    path: 'admin',
    loadChildren: () =>
      import('@features/admin/admin.routes').then((m) => m.adminRoutes),
  },

  // Fallback redirect
  {
    path: '**',
    redirectTo: '',
  },
];
