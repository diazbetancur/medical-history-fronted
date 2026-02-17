/**
 * AuthStore Guards - Route Protection usando AuthStore
 *
 * Guards funcionales para protección de rutas usando el nuevo AuthStore
 * con soporte para contexts y permissions.
 */

import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { ContextDto } from '@core/models';
import { AuthStore } from './auth.store';

/**
 * Context types que puede tener un usuario
 */
export type ContextType = 'ADMIN' | 'PROFESSIONAL' | 'PATIENT';

/**
 * Route data para guards basados en contexto
 */
export interface ContextRouteData {
  /** Required context type */
  requiredContext?: ContextType;
  /** Where to redirect if access denied */
  redirectTo?: string;
}

/**
 * Route data para guards basados en permisos
 */
export interface PermissionRouteData {
  /** Required permissions - user needs ANY of these (OR logic) */
  requiredPermissions?: string[];
  /** Required permissions - user needs ALL of these (AND logic) */
  requiredPermissionsAll?: string[];
  /** Where to redirect if access denied */
  redirectTo?: string;
}

/**
 * Auth Guard (usando AuthStore)
 *
 * Protege rutas verificando que:
 * 1. Hay un token válido
 * 2. El usuario está cargado (user !== null)
 *
 * Características:
 * - Usa AuthStore.isAuthenticated() (signal)
 * - Redirige a /login si no autenticado
 * - Guarda returnUrl en query params
 * - SSR-safe
 *
 * @example
 * ```typescript
 * {
 *   path: 'dashboard',
 *   canActivate: [authStoreGuard],
 *   loadComponent: () => import('./dashboard.page'),
 * }
 * ```
 */
export const authStoreGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    return true;
  }

  // Store intended URL for redirect after login
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/**
 * Context Guard
 *
 * Protege rutas verificando que el usuario tenga un contexto específico
 * disponible en su lista de contextos.
 *
 * Características:
 * - Lee requiredContext desde route.data
 * - Verifica que user.contexts incluya el contexto requerido
 * - Redirige a /unauthorized si no tiene acceso
 * - Funciona con CLIENTE y PROFESIONAL contexts
 *
 * ⚠️ IMPORTANTE: Este guard verifica que el contexto EXISTA en user.contexts,
 * no necesariamente que sea el contexto ACTUAL (currentContext).
 *
 * @example Ruta solo para profesionales
 * ```typescript
 * {
 *   path: 'agenda',
 *   canActivate: [authStoreGuard, contextGuard],
 *   data: {
 *     requiredContext: 'PROFESIONAL',
 *   },
 *   loadChildren: () => import('./agenda/agenda.routes'),
 * }
 * ```
 *
 * @example Ruta solo para clientes
 * ```typescript
 * {
 *   path: 'appointments',
 *   canActivate: [authStoreGuard, contextGuard],
 *   data: {
 *     requiredContext: 'CLIENTE',
 *   },
 *   loadComponent: () => import('./appointments.page'),
 * }
 * ```
 */
export const contextGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Verificar autenticación primero
  if (!authStore.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  // Leer requiredContext de route data
  const data = route.data as ContextRouteData;
  const requiredContext = data.requiredContext;

  if (!requiredContext) {
    return router.createUrlTree([data.redirectTo || '/unauthorized']);
  }

  // Verificar que el usuario tenga el contexto requerido
  const hasContext = isContextAllowed(authStore, requiredContext);

  if (hasContext) {
    return true;
  }

  // Redirigir si no tiene el contexto
  return router.createUrlTree([data.redirectTo || '/unauthorized']);
};

/**
 * Permission Guard (usando AuthStore)
 *
 * Protege rutas verificando que el usuario tenga los permisos requeridos.
 *
 * Soporta dos modos:
 * - **requiredPermissions**: Lógica OR (usuario necesita AL MENOS UNO)
 * - **requiredPermissionsAll**: Lógica AND (usuario necesita TODOS)
 *
 * Características:
 * - Lee permisos desde route.data
 * - Redirige a /forbidden si falla
 * - SSR-safe
 *
 * ⚠️ IMPORTANTE: Este guard es solo para UX. La seguridad real se
 * implementa en el backend (403 responses).
 *
 * @example Any permission (OR logic)
 * ```typescript
 * {
 *   path: 'reports',
 *   canActivate: [authStoreGuard, permissionStoreGuard],
 *   data: {
 *     requiredPermissions: ['Reports.View', 'Reports.Export'],
 *   },
 * }
 * ```
 *
 * @example All permissions (AND logic)
 * ```typescript
 * {
 *   path: 'settings',
 *   canActivate: [authStoreGuard, permissionStoreGuard],
 *   data: {
 *     requiredPermissionsAll: ['Settings.View', 'Settings.Edit'],
 *   },
 * }
 * ```
 */
export const permissionStoreGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Verificar autenticación primero
  if (!authStore.isAuthenticated()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  // Leer permissions de route data
  const data = route.data as PermissionRouteData;
  const requiredPermissions = data.requiredPermissions;
  const requiredPermissionsAll = data.requiredPermissionsAll;

  // Si no hay permisos especificados, denegar acceso (fail-closed)
  if (!requiredPermissions && !requiredPermissionsAll) {
    return router.createUrlTree([data.redirectTo || '/forbidden']);
  }

  // Verificar permisos (OR logic)
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAny = hasAnyPermission(authStore, requiredPermissions);
    if (!hasAny) {
      return router.createUrlTree([data.redirectTo || '/forbidden']);
    }
  }

  // Verificar permisos (AND logic)
  if (requiredPermissionsAll && requiredPermissionsAll.length > 0) {
    const hasAll = hasAllPermissions(authStore, requiredPermissionsAll);
    if (!hasAll) {
      return router.createUrlTree([data.redirectTo || '/forbidden']);
    }
  }

  return true;
};

/**
 * Verifica si el usuario tiene un permiso específico
 */
export function hasPermission(
  authStore: AuthStore,
  permission: string,
): boolean {
  const userPermissions = authStore.userPermissions();
  return userPermissions.includes(permission);
}

/**
 * Verifica si el usuario tiene AL MENOS UNO de los permisos (OR logic)
 *
 * @example
 * ```typescript
 * if (hasAnyPermission(authStore, ['Reports.View', 'Reports.Export'])) {
 *   console.log('User can view or export reports');
 * }
 * ```
 */
export function hasAnyPermission(
  authStore: AuthStore,
  permissions: string[],
): boolean {
  const userPermissions = authStore.userPermissions();
  return permissions.some((perm) => userPermissions.includes(perm));
}

/**
 * Verifica si el usuario tiene TODOS los permisos (AND logic)
 */
export function hasAllPermissions(
  authStore: AuthStore,
  permissions: string[],
): boolean {
  const userPermissions = authStore.userPermissions();
  return permissions.every((perm) => userPermissions.includes(perm));
}

/**
 * Verifica si el usuario tiene un contexto específico disponible
 */
export function isContextAllowed(
  authStore: AuthStore,
  contextType: ContextType,
): boolean {
  const contexts = authStore.availableContexts();
  const hasContext = contexts.some((ctx) => ctx.type === contextType);
  if (hasContext) {
    return true;
  }

  const roles = new Set(authStore.userRoles().map((role) => role.toUpperCase()));
  const roleFallbackByContext: Record<ContextType, string[]> = {
    ADMIN: ['ADMIN', 'SUPERADMIN'],
    PROFESSIONAL: ['PROFESSIONAL'],
    PATIENT: ['CLIENT', 'PATIENT'],
  };

  return roleFallbackByContext[contextType].some((role) => roles.has(role));
}

/**
 * Verifica si el contexto ACTUAL del usuario es del tipo especificado
 */
export function isCurrentContext(
  authStore: AuthStore,
  contextType: ContextType,
): boolean {
  const currentContext = authStore.currentContext();
  return currentContext?.type === contextType;
}

/**
 * Obtiene todos los contextos de un tipo específico
 */
export function getContextsByType(
  authStore: AuthStore,
  contextType: ContextType,
): ContextDto[] {
  const contexts = authStore.availableContexts();
  return contexts.filter((ctx) => ctx.type === contextType);
}

/**
 * Verifica si el usuario tiene múltiples contextos de un tipo
 */
export function hasMultipleContexts(
  authStore: AuthStore,
  contextType: ContextType,
): boolean {
  const contexts = getContextsByType(authStore, contextType);
  return contexts.length > 1;
}
