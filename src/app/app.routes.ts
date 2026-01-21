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
        (m) => m.LoginPageComponent,
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

  // 404 Not Found page
  {
    path: 'not-found',
    loadComponent: () =>
      import('@features/public/pages/not-found/not-found.page').then(
        (m) => m.NotFoundPageComponent,
      ),
    title: 'Página no encontrada - ProDirectory',
  },

  // 403 Forbidden page (alias /forbidden for backwards compatibility)
  {
    path: '403',
    loadComponent: () =>
      import('@features/public/pages/not-authorized/not-authorized.page').then(
        (m) => m.NotAuthorizedPageComponent,
      ),
    title: 'Acceso No Autorizado - ProDirectory',
  },
  {
    path: 'forbidden',
    redirectTo: '403', // Redirect to 403 for consistency
  },

  // Fallback redirect to not-found
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
