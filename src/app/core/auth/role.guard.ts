import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AccessMode, RouteAccessData } from './access-control';
import { hasAllRoles, hasAnyRole } from './roles';
import { AuthService } from './auth.service';

/**
 * Flexible Role Guard with support for:
 * - Multiple roles with 'any' (OR) or 'all' (AND) mode
 * - Future permission checking
 * - Centralized access control configuration
 *
 * Route data options:
 * - roles: string[] - Array of allowed roles
 * - roleMode: 'any' | 'all' - How to evaluate roles (default: 'any')
 * - permissions: string[] - (Future) Array of required permissions
 * - permissionMode: 'any' | 'all' - How to evaluate permissions (default: 'any')
 * - redirectTo: string - Where to redirect if denied (default: '/login')
 *
 * @example Basic usage (any role matches):
 * {
 *   path: 'admin',
 *   data: { roles: ['Admin', 'SuperAdmin'] },
 *   canActivate: [roleGuard]
 * }
 *
 * @example All roles required:
 * {
 *   path: 'special',
 *   data: { roles: ['Admin', 'Analyst'], roleMode: 'all' },
 *   canActivate: [roleGuard]
 * }
 *
 * @example Using centralized config:
 * import { routeData } from '@shared/auth';
 * {
 *   path: 'admin',
 *   data: routeData('admin'),
 *   canActivate: [roleGuard]
 * }
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Extract route data
  const data = route.data as RouteAccessData;
  const requiredRoles = data.roles as string[] | undefined;
  const roleMode: AccessMode = data.roleMode || 'any';
  const requiredPermissions = data.permissions as string[] | undefined;
  const permissionMode: AccessMode = data.permissionMode || 'any';
  const redirectTo = data.redirectTo || '/login';

  // First check authentication
  if (!authService.isAuthenticated()) {
    return router.createUrlTree([redirectTo], {
      queryParams: { returnUrl: state.url },
    });
  }

  // If no roles required, allow access (authenticated is enough)
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // Get user roles and permissions from session
  const userRoles = authService.session()?.roles || [];
  const userPermissions = authService.session()?.permissions || [];

  // Check roles based on mode
  const rolesSatisfied =
    roleMode === 'any'
      ? hasAnyRole(userRoles, requiredRoles)
      : hasAllRoles(userRoles, requiredRoles);

  if (!rolesSatisfied) {
    // User is authenticated but doesn't have required role
    // Redirect to appropriate location based on their roles
    return router.createUrlTree([getUnauthorizedRedirect(userRoles)]);
  }

  // Check permissions if specified (future feature)
  if (requiredPermissions && requiredPermissions.length > 0) {
    const permsSatisfied =
      permissionMode === 'any'
        ? hasAnyRole(userPermissions, requiredPermissions)
        : hasAllRoles(userPermissions, requiredPermissions);

    if (!permsSatisfied) {
      return router.createUrlTree([getUnauthorizedRedirect(userRoles)]);
    }
  }

  return true;
};

/**
 * Determine redirect path for unauthorized but authenticated users.
 */
function getUnauthorizedRedirect(userRoles: readonly string[]): string {
  // If user is a professional, send to professional dashboard
  if (userRoles.includes('Professional')) {
    return '/dashboard';
  }
  // Otherwise, send to home
  return '/';
}

/**
 * Guard specifically for admin areas.
 * Convenience wrapper that uses ADMIN_ROLES from centralized config.
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  if (!authService.isAdmin()) {
    return router.createUrlTree(['/']);
  }

  return true;
};

/**
 * Guard specifically for professional dashboard.
 * Convenience wrapper that uses PROFESSIONAL_ROLES from centralized config.
 */
export const professionalGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  if (!authService.isProfessional()) {
    return router.createUrlTree(['/']);
  }

  return true;
};
