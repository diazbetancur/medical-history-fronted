import { inject, isDevMode } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Route data interface for permission-based access control
 */
export interface PermissionRouteData {
  /** Required permissions - user needs ANY of these (OR logic) */
  permissionsAny?: string[];
  /** Required permissions - user needs ALL of these (AND logic) */
  permissionsAll?: string[];
  /** Where to redirect if access denied */
  redirectTo?: string;
}

/**
 * Permission Guard
 *
 * Validates access based on user's permissions array from session.
 * Works alongside RoleGuard for fine-grained access control.
 *
 * IMPORTANT: This is a UX-only guard. Real security is enforced by backend (403).
 *
 * SECURITY: FAIL-CLOSED BEHAVIOR
 * - If route has permissionGuard but no permission configuration (permissionsAny/All),
 *   access is DENIED and redirected to /403
 * - In dev mode, logs a warning to help identify misconfigured routes
 * - This prevents accidentally allowing access to protected routes
 *
 * @example Any permission (OR logic):
 * {
 *   path: 'reports',
 *   data: { permissionsAny: ['Reports.View', 'Reports.Export'] },
 *   canActivate: [permissionGuard]
 * }
 *
 * @example All permissions (AND logic):
 * {
 *   path: 'settings',
 *   data: { permissionsAll: ['Settings.View', 'Settings.Edit'] },
 *   canActivate: [permissionGuard]
 * }
 */
export const permissionGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Extract route data
  const data = route.data as PermissionRouteData;
  const permissionsAny = data.permissionsAny;
  const permissionsAll = data.permissionsAll;
  const redirectTo = data.redirectTo || '/forbidden';

  // First check authentication
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  // SECURITY: Fail-closed - if no permissions configured, deny access
  // This prevents accidental exposure of protected routes
  const hasPermissionsAny = permissionsAny && permissionsAny.length > 0;
  const hasPermissionsAll = permissionsAll && permissionsAll.length > 0;

  if (!hasPermissionsAny && !hasPermissionsAll) {
    // In dev mode, warn about misconfigured route
    if (isDevMode()) {
      console.warn(
        `⚠️ [permissionGuard] Route "${state.url}" has permissionGuard but no permission configuration (permissionsAny/permissionsAll). Access denied (fail-closed).`,
        {
          routePath: route.routeConfig?.path || 'unknown',
          routeData: route.data,
          fullUrl: state.url,
        },
      );
    }

    // Deny access and redirect to /403
    return router.createUrlTree(['/403']);
  }

  // Get user permissions from session
  const userPermissions = authService.permissions();

  // Check permissionsAny (OR logic)
  if (permissionsAny && permissionsAny.length > 0) {
    const hasAny = hasAnyPermission(userPermissions, permissionsAny);
    if (!hasAny) {
      return router.createUrlTree([redirectTo]);
    }
  }

  // Check permissionsAll (AND logic)
  if (permissionsAll && permissionsAll.length > 0) {
    const hasAll = hasAllPermissions(userPermissions, permissionsAll);
    if (!hasAll) {
      return router.createUrlTree([redirectTo]);
    }
  }

  return true;
};

/**
 * Check if user has any of the required permissions (OR logic)
 */
export function hasAnyPermission(
  userPermissions: readonly string[],
  requiredPermissions: readonly string[],
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  return requiredPermissions.some((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has all required permissions (AND logic)
 */
export function hasAllPermissions(
  userPermissions: readonly string[],
  requiredPermissions: readonly string[],
): boolean {
  if (!userPermissions || userPermissions.length === 0) return false;
  return requiredPermissions.every((perm) => userPermissions.includes(perm));
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  userPermissions: readonly string[],
  permission: string,
): boolean {
  return userPermissions?.includes(permission) ?? false;
}

/**
 * Check if user has any admin-level permission
 * Admin permissions typically start with specific prefixes
 */
export function hasAnyAdminPermission(
  userPermissions: readonly string[],
): boolean {
  const adminPrefixes = [
    'Profiles.',
    'ServiceRequests.',
    'Users.',
    'Roles.',
    'Catalog.',
    'Configuration.',
  ];
  return (
    userPermissions?.some((p) =>
      adminPrefixes.some((prefix) => p.startsWith(prefix)),
    ) ?? false
  );
}
