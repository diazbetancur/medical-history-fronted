import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Context Guard
 * Renamed from roleGuard to contextGuard to match route data naming.
 * Validates access based on user's roles which represent different contexts
 * (ADMIN, PROFESSIONAL, PATIENT).
 *
 * Usage in routes with data.requiredContext:
 * {
 *   path: 'patient',
 *   canActivate: [authGuard, contextGuard],
 *   data: { requiredContext: 'PATIENT' }
 * }
 */
export const contextGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const requiredContext = route.data?.['requiredContext'] as string | undefined;

  if (!requiredContext) {
    // No context requirement specified - allow access
    return true;
  }

  // Map context names to role names
  const contextToRoleMap: Record<string, string[]> = {
    ADMIN: ['Admin', 'SuperAdmin'],
    PROFESSIONAL: ['Professional'],
    PATIENT: ['Client'], // In this system, Client role = Patient context
  };

  const allowedRoles = contextToRoleMap[requiredContext] || [];
  const userRoles = authService.roles();

  const hasAccess = allowedRoles.some((role) => userRoles.includes(role));

  if (hasAccess) {
    return true;
  }

  // User doesn't have required context - redirect to unauthorized
  return router.createUrlTree(['/unauthorized']);
};
