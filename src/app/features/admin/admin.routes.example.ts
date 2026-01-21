/**
 * ============================================================================
 * EJEMPLO: Admin Routes con RBAC Guards
 * ============================================================================
 *
 * Configuración de rutas del área administrativa usando protección
 * basada en permisos (RBAC), no en roles.
 *
 * Archivo: src/app/features/admin/admin.routes.ts
 */

import { Routes } from '@angular/router';
import { adminAreaGuard, authGuard, permissionGuard } from '@core/auth';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';

/**
 * Admin Routes
 *
 * Arquitectura de protección:
 *
 * 1. authGuard → Verifica que el usuario esté autenticado
 * 2. adminAreaGuard → Verifica que tenga AL MENOS UN permiso admin
 * 3. permissionGuard → Verifica permisos específicos por ruta
 *
 * Permisos considerados "admin":
 * - Users.*
 * - Roles.*
 * - Catalog.*
 * - Configuration.*
 * - Profiles.*
 * - ServiceRequests.*
 */
export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    // ✅ Doble protección: auth + admin area
    canActivate: [authGuard, adminAreaGuard],
    children: [
      // ========================================
      // Dashboard - Sin permiso específico
      // ========================================
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin-home/admin-home.page').then(
            (m) => m.AdminHomePageComponent,
          ),
        title: 'Admin Panel - ProDirectory',
        // ✅ Dashboard accesible a cualquier usuario con permisos admin
        // No requiere permiso específico
      },

      // ========================================
      // Users Management
      // ========================================
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/users-list.page').then(
            (m) => m.UsersListPageComponent,
          ),
        title: 'Gestión de Usuarios - Admin',
        canActivate: [permissionGuard],
        data: {
          permissions: ['Users.View'], // ✅ Permiso mínimo
        },
      },
      {
        path: 'users/create',
        loadComponent: () =>
          import('./pages/users/user-create.page').then(
            (m) => m.UserCreatePageComponent,
          ),
        title: 'Nuevo Usuario - Admin',
        canActivate: [permissionGuard],
        data: {
          permissions: ['Users.Create'],
        },
      },
      {
        path: 'users/:id/edit',
        loadComponent: () =>
          import('./pages/users/user-edit.page').then(
            (m) => m.UserEditPageComponent,
          ),
        title: 'Editar Usuario - Admin',
        canActivate: [permissionGuard],
        data: {
          permissions: ['Users.Update'],
        },
      },

      // ========================================
      // Roles & Permissions Management
      // ========================================
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/roles/roles-list.page').then(
            (m) => m.RolesListPageComponent,
          ),
        title: 'Gestión de Roles - Admin',
        canActivate: [permissionGuard],
        data: {
          permissions: ['Roles.View'],
        },
      },
      {
        path: 'roles/create',
        loadComponent: () =>
          import('./pages/roles/role-create.page').then(
            (m) => m.RoleCreatePageComponent,
          ),
        title: 'Nuevo Rol - Admin',
        canActivate: [permissionGuard],
        data: {
          permissions: ['Roles.Create'],
        },
      },
      {
        path: 'roles/:id/edit',
        loadComponent: () =>
          import('./pages/roles/role-edit.page').then(
            (m) => m.RoleEditPageComponent,
          ),
        title: 'Editar Rol - Admin',
        canActivate: [permissionGuard],
        data: {
          permissions: ['Roles.Update'],
        },
      },
      {
        path: 'roles/:id/permissions',
        loadComponent: () =>
          import('./pages/roles/role-permissions.page').then(
            (m) => m.RolePermissionsPageComponent,
          ),
        title: 'Permisos del Rol - Admin',
        canActivate: [permissionGuard],
        data: {
          permissions: ['Roles.ManagePermissions'],
        },
      },

      // ========================================
      // Professionals (Profiles) Management
      // ========================================
      {
        path: 'professionals',
        loadComponent: () =>
          import('./pages/professionals-review/professionals-review.page').then(
            (m) => m.ProfessionalsReviewPageComponent,
          ),
        title: 'Revisar Profesionales - Admin',
        canActivate: [permissionGuard],
        data: {
          permissions: ['Profiles.View'],
        },
      },

      // ========================================
      // Service Requests Management
      // ========================================
      {
        path: 'requests',
        loadComponent: () =>
          import('./pages/requests/requests.page').then(
            (m) => m.AdminRequestsPageComponent,
          ),
        title: 'Gestión de Solicitudes - Admin',
        canActivate: [permissionGuard],
        data: {
          permissions: ['ServiceRequests.ViewAll'],
        },
      },

      // ========================================
      // Catalog Management
      // ========================================
      {
        path: 'catalog',
        loadComponent: () =>
          import('./pages/catalog/catalog.page').then(
            (m) => m.CatalogPageComponent,
          ),
        title: 'Catálogos - Admin',
        canActivate: [permissionGuard],
        data: {
          // ✅ Cualquiera de estos permisos (OR logic)
          permissions: [
            'Catalog.ManageCountries',
            'Catalog.ManageCities',
            'Catalog.ManageCategories',
          ],
        },
      },

      // ========================================
      // Configuration
      // ========================================
      {
        path: 'config',
        loadComponent: () =>
          import('./pages/config/config.page').then(
            (m) => m.ConfigPageComponent,
          ),
        title: 'Configuración - Admin',
        canActivate: [permissionGuard],
        data: {
          permissions: ['Configuration.View'],
        },
      },
      {
        path: 'config/audit-log',
        loadComponent: () =>
          import('./pages/config/audit-log.page').then(
            (m) => m.AuditLogPageComponent,
          ),
        title: 'Logs de Auditoría - Admin',
        canActivate: [permissionGuard],
        data: {
          permissions: ['Configuration.ViewAuditLog'],
        },
      },
    ],
  },
];

/**
 * ============================================================================
 * NOTAS DE ARQUITECTURA
 * ============================================================================
 *
 * 1. JERARQUÍA DE PROTECCIÓN:
 *    - authGuard → Autenticación básica
 *    - adminAreaGuard → Al menos un permiso admin
 *    - permissionGuard → Permiso específico de la ruta
 *
 * 2. LÓGICA OR EN PERMISOS:
 *    Cuando data.permissions tiene múltiples valores, el usuario
 *    necesita AL MENOS UNO (OR logic).
 *
 *    Ejemplo:
 *    data: {
 *      permissions: ['A', 'B', 'C']  // Necesita A OR B OR C
 *    }
 *
 * 3. REDIRECT EN FALLO:
 *    - No autenticado → /login?returnUrl=...
 *    - Sin permisos admin → /403
 *    - Sin permiso específico → /403
 *
 * 4. CUSTOM REDIRECT:
 *    Se puede customizar el redirect:
 *    data: {
 *      permissions: ['VIP.Access'],
 *      redirectTo: '/upgrade'  // En lugar de /403
 *    }
 *
 * 5. DASHBOARD SIN PERMISO:
 *    El dashboard no tiene permisionGuard, es accesible a
 *    cualquier usuario que pase adminAreaGuard.
 *
 * 6. SSR-SAFE:
 *    Todos los guards son SSR-safe, usan AuthService que
 *    detecta la plataforma antes de acceder a localStorage.
 */

/**
 * ============================================================================
 * EJEMPLO: App Routes con Protección RBAC
 * ============================================================================
 *
 * Archivo: src/app/app.routes.ts
 */
/*
import { Routes } from '@angular/router';
import { authGuard } from '@core/auth';
import { adminAreaGuard } from '@core/auth';

export const routes: Routes = [
  // ========================================
  // Public Routes
  // ========================================
  {
    path: '',
    loadComponent: () =>
      import('@features/public/pages/home/home.page').then(
        (m) => m.HomePageComponent,
      ),
  },

  // ========================================
  // Auth Routes
  // ========================================
  {
    path: 'login',
    loadComponent: () =>
      import('@features/app/pages/login/login.page').then(
        (m) => m.LoginPageComponent,
      ),
  },

  // ========================================
  // Protected Routes (Requires Auth)
  // ========================================
  {
    path: 'dashboard',
    loadComponent: () =>
      import('@features/app/pages/dashboard-home/dashboard-home.page').then(
        (m) => m.DashboardHomePageComponent,
      ),
    canActivate: [authGuard],
  },

  // ========================================
  // Admin Area (Lazy-loaded)
  // ========================================
  {
    path: 'admin',
    canActivate: [authGuard, adminAreaGuard],  // ✅ Protección del módulo
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.adminRoutes),
  },

  // ========================================
  // Error Pages
  // ========================================
  {
    path: '403',
    loadComponent: () =>
      import('@features/public/pages/not-authorized/not-authorized.page').then(
        (m) => m.NotAuthorizedPageComponent,
      ),
    title: 'Acceso No Autorizado',
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('@features/public/pages/not-found/not-found.page').then(
        (m) => m.NotFoundPageComponent,
      ),
    title: 'Página no encontrada',
  },

  // ========================================
  // Fallback
  // ========================================
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
*/

/**
 * ============================================================================
 * MATRIZ DE PERMISOS POR RUTA
 * ============================================================================
 *
 * | Ruta                        | Permiso Requerido              | Lógica |
 * |-----------------------------|-------------------------------|--------|
 * | /admin                      | Cualquier admin permission    | -      |
 * | /admin/dashboard            | (ninguno específico)          | -      |
 * | /admin/users                | Users.View                    | Single |
 * | /admin/users/create         | Users.Create                  | Single |
 * | /admin/users/:id/edit       | Users.Update                  | Single |
 * | /admin/roles                | Roles.View                    | Single |
 * | /admin/roles/create         | Roles.Create                  | Single |
 * | /admin/roles/:id/edit       | Roles.Update                  | Single |
 * | /admin/roles/:id/permissions| Roles.ManagePermissions       | Single |
 * | /admin/professionals        | Profiles.View                 | Single |
 * | /admin/requests             | ServiceRequests.ViewAll       | Single |
 * | /admin/catalog              | Catalog.Manage* (any)         | OR     |
 * | /admin/config               | Configuration.View            | Single |
 * | /admin/config/audit-log     | Configuration.ViewAuditLog    | Single |
 */

/**
 * ============================================================================
 * TESTING
 * ============================================================================
 *
 * Escenarios a probar:
 *
 * 1. Usuario NO autenticado:
 *    - Intenta /admin/users → Redirect /login?returnUrl=/admin/users
 *
 * 2. Usuario autenticado SIN permisos admin:
 *    - Intenta /admin → Redirect /403
 *
 * 3. Usuario con Users.View:
 *    - Accede /admin/users ✅
 *    - Intenta /admin/users/create → Redirect /403
 *
 * 4. Usuario con Users.View + Users.Create:
 *    - Accede /admin/users ✅
 *    - Accede /admin/users/create ✅
 *
 * 5. Usuario con Catalog.ManageCountries:
 *    - Accede /admin/catalog ✅ (OR logic)
 *
 * 6. Usuario con múltiples permisos admin:
 *    - Accede /admin/dashboard ✅
 *    - Ve solo las rutas con sus permisos en el menú
 */

export {};
