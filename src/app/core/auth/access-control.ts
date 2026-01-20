/**
 * Route Access Control Configuration
 *
 * Centralized configuration for route-level access control.
 * Defines which roles and permissions can access each route/module.
 *
 * @example Adding access for a new module:
 * 1. Add entry to ROUTE_ACCESS with roles/permissions
 * 2. Reference in route configuration using routeAccessGuard
 */

import { ADMIN_ROLES, PROFESSIONAL_ROLES, UserRole } from './roles';

// =============================================================================
// Access Control Types
// =============================================================================

/**
 * Mode for role checking:
 * - 'any': User needs at least ONE of the specified roles (OR logic)
 * - 'all': User needs ALL of the specified roles (AND logic)
 */
export type AccessMode = 'any' | 'all';

/**
 * Configuration for route access control.
 */
export interface RouteAccessConfig {
  /** Roles that can access this route */
  roles: readonly string[];
  /** How to evaluate roles - 'any' (default) or 'all' */
  mode?: AccessMode;
  /** Optional permissions required (for future use) */
  permissions?: readonly string[];
  /** How to evaluate permissions - 'any' (default) or 'all' */
  permissionMode?: AccessMode;
  /** Redirect path if access denied (default: '/login') */
  redirectTo?: string;
  /** Custom access denied message */
  deniedMessage?: string;
}

/**
 * Route data structure for Angular route configuration.
 * This is what gets attached to route.data
 */
export interface RouteAccessData {
  /** Array of allowed roles */
  roles?: readonly string[];
  /** Role evaluation mode */
  roleMode?: AccessMode;
  /** Array of required permissions (future) */
  permissions?: readonly string[];
  /** Permission evaluation mode */
  permissionMode?: AccessMode;
  /** Where to redirect if denied */
  redirectTo?: string;
}

// =============================================================================
// Route Access Configuration
// =============================================================================

/**
 * Centralized route access configuration.
 * Keys are route identifiers, values define access rules.
 */
export const ROUTE_ACCESS = {
  // -------------------------------------------------------------------------
  // Admin Module Routes
  // -------------------------------------------------------------------------
  admin: {
    roles: ADMIN_ROLES,
    mode: 'any',
    redirectTo: '/login',
    deniedMessage: 'Se requiere acceso de administrador',
  } satisfies RouteAccessConfig,

  'admin.dashboard': {
    roles: ADMIN_ROLES,
    mode: 'any',
  } satisfies RouteAccessConfig,

  'admin.professionals': {
    roles: ADMIN_ROLES,
    mode: 'any',
  } satisfies RouteAccessConfig,

  'admin.services': {
    roles: ADMIN_ROLES,
    mode: 'any',
  } satisfies RouteAccessConfig,

  'admin.requests': {
    roles: ADMIN_ROLES,
    mode: 'any',
  } satisfies RouteAccessConfig,

  'admin.catalogs': {
    roles: ADMIN_ROLES,
    mode: 'any',
  } satisfies RouteAccessConfig,

  'admin.settings': {
    roles: ['SuperAdmin'] as readonly UserRole[],
    mode: 'any',
    deniedMessage: 'Solo SuperAdmin puede acceder a configuración',
  } satisfies RouteAccessConfig,

  // -------------------------------------------------------------------------
  // Professional Dashboard Routes
  // -------------------------------------------------------------------------
  professional: {
    roles: PROFESSIONAL_ROLES,
    mode: 'any',
    redirectTo: '/login',
    deniedMessage: 'Se requiere cuenta de profesional',
  } satisfies RouteAccessConfig,

  'professional.dashboard': {
    roles: PROFESSIONAL_ROLES,
    mode: 'any',
  } satisfies RouteAccessConfig,

  'professional.profile': {
    roles: PROFESSIONAL_ROLES,
    mode: 'any',
  } satisfies RouteAccessConfig,

  'professional.services': {
    roles: PROFESSIONAL_ROLES,
    mode: 'any',
  } satisfies RouteAccessConfig,

  'professional.requests': {
    roles: PROFESSIONAL_ROLES,
    mode: 'any',
  } satisfies RouteAccessConfig,

  'professional.settings': {
    roles: PROFESSIONAL_ROLES,
    mode: 'any',
  } satisfies RouteAccessConfig,

  // -------------------------------------------------------------------------
  // Authenticated User Routes (any logged-in user)
  // -------------------------------------------------------------------------
  authenticated: {
    roles: [
      'Client',
      'Professional',
      'Admin',
      'SuperAdmin',
    ] as readonly UserRole[],
    mode: 'any',
    redirectTo: '/login',
  } satisfies RouteAccessConfig,
} as const;

// Type for route access keys
export type RouteAccessKey = keyof typeof ROUTE_ACCESS;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get route access configuration by key.
 * Returns undefined if key not found.
 */
export function getRouteAccess(key: RouteAccessKey): RouteAccessConfig {
  return ROUTE_ACCESS[key];
}

/**
 * Convert RouteAccessConfig to RouteAccessData for route configuration.
 */
export function toRouteData(config: RouteAccessConfig): RouteAccessData {
  return {
    roles: config.roles,
    roleMode: config.mode,
    permissions: config.permissions,
    permissionMode: config.permissionMode,
    redirectTo: config.redirectTo,
  };
}

/**
 * Create route data from a route access key.
 * Convenient helper for route configuration.
 *
 * @example
 * {
 *   path: 'admin',
 *   data: routeData('admin'),
 *   canActivate: [roleGuard],
 * }
 */
export function routeData(key: RouteAccessKey): RouteAccessData {
  return toRouteData(ROUTE_ACCESS[key]);
}

/**
 * Check if user roles satisfy access requirements.
 */
export function checkAccess(
  userRoles: readonly string[],
  config: RouteAccessConfig,
  userPermissions: readonly string[] = []
): boolean {
  const mode = config.mode || 'any';

  // Check roles
  const rolesSatisfied =
    mode === 'any'
      ? userRoles.some((role) => config.roles.includes(role))
      : config.roles.every((role) => userRoles.includes(role));

  if (!rolesSatisfied) {
    return false;
  }

  // Check permissions if specified
  if (config.permissions && config.permissions.length > 0) {
    const permMode = config.permissionMode || 'any';
    const permsSatisfied =
      permMode === 'any'
        ? userPermissions.some((perm) => config.permissions!.includes(perm))
        : config.permissions.every((perm) => userPermissions.includes(perm));

    return permsSatisfied;
  }

  return true;
}
