import { Routes } from '@angular/router';
import {
  adminAreaGuard,
  authGuard,
  permissionGuard,
  routeData,
  uiProfileAdminGuard,
} from '@core/auth';
import { PERMISSIONS } from './admin-menu.config';
import { AdminShellComponent } from './layouts/admin-shell.component';

/**
 * Admin Routes
 *
 * Protected by:
 * - authGuard: Ensures user is authenticated
 * - uiProfileAdminGuard: UX guard - redirects non-admin profiles (checks computed UiProfile)
 * - adminAreaGuard: Security guard - ensures user has ANY admin permission
 * - AdminShellComponent: Layout wrapper (no redirect logic, just renders)
 * - permissionGuard: Fine-grained permission check per route
 *
 * Security Layers:
 * 1. Parent route: authGuard + uiProfileAdminGuard + adminAreaGuard
 * 2. AdminShellComponent: Pure presentation (renders admin layout)
 * 3. Children routes: permissionGuard (validates specific permissions)
 * 4. Backend: Final enforcement (403 responses)
 *
 * Note: uiProfileAdminGuard is a UX guard (redirects based on computed profile).
 * adminAreaGuard is the security guard (validates actual permissions).
 * This separation allows clean UX routing while maintaining permission security.
 */
export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    canActivate: [authGuard, uiProfileAdminGuard, adminAreaGuard],
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
            PERMISSIONS.CATALOG_MANAGE_INSTITUTIONS,
            PERMISSIONS.CATALOG_VIEW_INSTITUTIONS,
          ],
        },
      },
      {
        path: 'institutions',
        loadComponent: () =>
          import('./pages/institutions/institutions-list.page').then(
            (m) => m.InstitutionsListPage,
          ),
        title: 'Instituciones - Admin',
        canActivate: [permissionGuard],
        data: {
          permissionsAny: [
            PERMISSIONS.CATALOG_MANAGE_INSTITUTIONS,
            PERMISSIONS.CATALOG_VIEW_INSTITUTIONS,
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
