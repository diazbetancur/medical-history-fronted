/**
 * RBAC Guards - Permission-Based Route Protection
 *
 * Sistema de guards funcionales para protección de rutas basado en permisos
 * granulares (RBAC), sin depender de roles.
 */

import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Route data para protección basada en permisos
 *
 * @example
 * {
 *   path: 'users',
 *   canActivate: [permissionGuard],
 *   data: {
 *     permissions: ['Users.View', 'Users.Update']  // ANY logic (OR)
 *   }
 * }
 */
export interface PermissionRouteData {
  /**
   * Required permissions - user needs ANY of these (OR logic)
   * Si el array tiene múltiples permisos, el usuario necesita AL MENOS UNO
   */
  permissions?: string[];

  /**
   * Optional: Where to redirect if access denied
   * Default: '/403'
   */
  redirectTo?: string;
}

/**
 * Permission Guard
 *
 * Protege rutas verificando que el usuario tenga AL MENOS UNO de los
 * permisos especificados en route.data.permissions
 *
 * Características:
 * - Lee permisos desde route.data.permissions
 * - Usa lógica OR (cualquiera de los permisos)
 * - Redirige a /403 si falla
 * - Redirige a /login si no está autenticado
 * - SSR-safe
 *
 * ⚠️ IMPORTANTE: Este guard es solo para UX. La seguridad real se
 * implementa en el backend (403 responses).
 *
 * @example Basic usage
 * ```typescript
 * {
 *   path: 'users',
 *   canActivate: [permissionGuard],
 *   data: {
 *     permissions: ['Users.View']
 *   }
 * }
 * ```
 *
 * @example Multiple permissions (OR logic)
 * ```typescript
 * {
 *   path: 'reports',
 *   canActivate: [permissionGuard],
 *   data: {
 *     permissions: ['Reports.View', 'Reports.Export']  // Needs ANY
 *   }
 * }
 * ```
 *
 * @example Custom redirect
 * ```typescript
 * {
 *   path: 'admin',
 *   canActivate: [permissionGuard],
 *   data: {
 *     permissions: ['Admin.Access'],
 *     redirectTo: '/dashboard'
 *   }
 * }
 * ```
 */
export const permissionGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): boolean | import('@angular/router').UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Extract route data
  const data = route.data as PermissionRouteData;
  const requiredPermissions = data.permissions || [];
  const redirectTo = data.redirectTo || '/403';

  // 1. Check authentication first
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  // 2. If no permissions required, allow access
  if (requiredPermissions.length === 0) {
    return true;
  }

  // 3. Check if user has ANY of the required permissions (OR logic)
  const hasAccess = authService.hasAnyPermission(requiredPermissions);

  if (!hasAccess) {
    return router.createUrlTree([redirectTo]);
  }

  return true;
};

// ============================================================================
// 🛡️ ADMIN AREA GUARD
// ============================================================================

/**
 * Admin Area Guard
 *
 * Protege rutas del área administrativa verificando que el usuario tenga
 * AL MENOS UN permiso administrativo.
 *
 * Permisos administrativos considerados:
 * - Users.*
 * - Roles.*
 * - Catalog.*
 * - Configuration.*
 * - Profiles.*
 * - ServiceRequests.*
 *
 * Uso recomendado:
 * - Aplicar en el layout o ruta padre del área admin
 * - Combinar con permissionGuard para rutas específicas
 *
 * @example Layout protection
 * ```typescript
 * {
 *   path: 'admin',
 *   component: AdminLayoutComponent,
 *   canActivate: [adminAreaGuard],
 *   children: [
 *     {
 *       path: 'users',
 *       canActivate: [permissionGuard],
 *       data: { permissions: ['Users.View'] }
 *     }
 *   ]
 * }
 * ```
 */
export const adminAreaGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): boolean | import('@angular/router').UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Check authentication first
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  // 2. Check if user has any admin permission
  const hasAdminAccess = authService.isAdminArea();

  if (!hasAdminAccess) {
    return router.createUrlTree(['/403']);
  }

  return true;
};

/**
 * Check if user has ANY of the required permissions (OR logic)
 *
 * @param userPermissions - Current user's permissions
 * @param requiredPermissions - Permissions to check
 * @returns true if user has at least one permission
 */
export function hasAnyPermission(
  userPermissions: readonly string[],
  requiredPermissions: readonly string[],
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (!requiredPermissions || requiredPermissions.length === 0) return true;

  return requiredPermissions.some((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has ALL required permissions (AND logic)
 *
 * @param userPermissions - Current user's permissions
 * @param requiredPermissions - Permissions to check
 * @returns true if user has all permissions
 */
export function hasAllPermissions(
  userPermissions: readonly string[],
  requiredPermissions: readonly string[],
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  if (!requiredPermissions || requiredPermissions.length === 0) return true;

  return requiredPermissions.every((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has a specific permission
 *
 * @param userPermissions - Current user's permissions
 * @param permission - Permission to check
 * @returns true if user has the permission
 */
export function hasPermission(
  userPermissions: readonly string[],
  permission: string,
): boolean {
  return userPermissions?.includes(permission) ?? false;
}

/**
 * Check if user has any admin-level permission
 * Admin permissions start with: Users., Roles., Catalog., Configuration., Profiles., ServiceRequests.
 *
 * @param userPermissions - Current user's permissions
 * @returns true if user has at least one admin permission
 */
export function hasAnyAdminPermission(
  userPermissions: readonly string[],
): boolean {
  const adminPrefixes = [
    'Users.',
    'Roles.',
    'Catalog.',
    'Configuration.',
    'Profiles.',
    'ServiceRequests.',
  ];

  return (
    userPermissions?.some((p) =>
      adminPrefixes.some((prefix) => p.startsWith(prefix)),
    ) ?? false
  );
}
