import { Routes } from '@angular/router';
import {
  adminAreaGuard,
  authGuard,
  permissionGuard,
  routeData,
} from '@core/auth';
import { PERMISSIONS } from './admin-menu.config';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

/**
 * Admin Routes
 *
 * Protected by:
 * - authGuard: Ensures user is authenticated
 * - adminAreaGuard: Ensures user has ANY admin permission (permission-based, not role-based)
 * - permissionGuard: Fine-grained permission check per route
 *
 * Security Layers:
 * 1. Parent route: authGuard + adminAreaGuard (validates admin access)
 * 2. Children routes: permissionGuard (validates specific permissions)
 * 3. Backend: Final enforcement (403 responses)
 *
 * Note: adminAreaGuard uses permission-based validation, making it extensible
 * when backend adds new admin roles without frontend code changes.
 */
export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminAreaGuard],
    canActivateChild: [authGuard, adminAreaGuard],
    data: routeData('admin'),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/admin-home/admin-home.page').then(
            (m) => m.AdminHomePageComponent,
          ),
        title: 'Admin Panel - ProDirectory',
        // Dashboard accessible to any admin user (no specific permission required)
      },
      {
        path: 'professionals',
        loadComponent: () =>
          import('./pages/professionals-review/professionals-review.page').then(
            (m) => m.ProfessionalsReviewPageComponent,
          ),
        title: 'Revisar Profesionales - Admin',
        canActivate: [permissionGuard],
        data: {
          permissionsAny: [PERMISSIONS.PROFILES_VIEW],
        },
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('./pages/requests/requests.page').then(
            (m) => m.AdminRequestsPageComponent,
          ),
        title: 'Gestión de Solicitudes - Admin',
        canActivate: [permissionGuard],
        data: {
          permissionsAny: [PERMISSIONS.SERVICE_REQUESTS_VIEW_ALL],
        },
      },
      {
        path: 'catalogs',
        loadComponent: () =>
          import('./pages/admin-home/admin-home.page').then(
            (m) => m.AdminHomePageComponent,
          ), // Placeholder
        title: 'Catálogos - Admin',
        canActivate: [permissionGuard],
        data: {
          permissionsAny: [
            PERMISSIONS.CATALOG_MANAGE_COUNTRIES,
            PERMISSIONS.CATALOG_MANAGE_CITIES,
            PERMISSIONS.CATALOG_MANAGE_CATEGORIES,
          ],
        },
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users.page').then((m) => m.UsersPageComponent),
        title: 'Usuarios - Admin',
        canActivate: [permissionGuard],
        data: {
          permissionsAny: [PERMISSIONS.USERS_VIEW],
        },
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/roles/roles.page').then((m) => m.RolesPageComponent),
        title: 'Roles y Permisos - Admin',
        canActivate: [permissionGuard],
        data: {
          permissionsAny: [PERMISSIONS.ROLES_VIEW],
        },
      },
      {
        path: 'roles/:id/permissions',
        loadComponent: () =>
          import('./pages/roles/role-permissions.page').then(
            (m) => m.RolePermissionsPageComponent,
          ),
        title: 'Gestionar Permisos - Admin',
        canActivate: [permissionGuard],
        data: {
          permissionsAny: [PERMISSIONS.ROLES_MANAGE_PERMISSIONS],
        },
      },
      {
        path: 'config',
        loadComponent: () =>
          import('./pages/admin-home/admin-home.page').then(
            (m) => m.AdminHomePageComponent,
          ), // Placeholder
        title: 'Configuración - Admin',
        canActivate: [permissionGuard],
        data: {
          permissionsAny: [PERMISSIONS.CONFIGURATION_VIEW],
        },
      },
    ],
  },
];
