/**
 * Centralized Role Definitions
 *
 * This file is the single source of truth for all role-related constants.
 * When adding new roles, only this file needs to be modified.
 *
 * @example Adding a new role:
 * 1. Add to UserRole type
 * 2. Add to appropriate role group (ADMIN_ROLES, etc.)
 * 3. Update access-control.ts if needed for route permissions
 */

// =============================================================================
// Core Role Types
// =============================================================================

/**
 * All possible user roles in the system.
 * This is a union type to allow for type-safe role checking while
 * still accepting unknown roles from the API gracefully.
 */
export type UserRole =
  | 'Client'
  | 'Professional'
  | 'Admin'
  | 'SuperAdmin'
  // Future roles (reserved, not yet implemented in backend)
  | 'BusinessAdmin'
  | 'Moderator'
  | 'Support'
  | 'Analyst';

/**
 * Role as received from API - can be any string to handle
 * future roles without breaking the frontend.
 */
export type ApiRole = string;

// =============================================================================
// Role Groups
// =============================================================================

/**
 * Roles that have access to the admin area.
 * Add new admin-level roles here without modifying guards or routes.
 */
export const ADMIN_ROLES: readonly UserRole[] = [
  'Admin',
  'SuperAdmin',
  // Future admin roles - uncomment when backend supports them:
  // 'BusinessAdmin',
  // 'Moderator',
  // 'Support',
  // 'Analyst',
] as const;

/**
 * Roles that have access to the professional dashboard.
 */
export const PROFESSIONAL_ROLES: readonly UserRole[] = [
  'Professional',
  'SuperAdmin', // SuperAdmin can impersonate/access all areas
] as const;

/**
 * Roles with full system access (can bypass most restrictions).
 */
export const SUPER_ROLES: readonly UserRole[] = ['SuperAdmin'] as const;

/**
 * Public/client roles (basic authenticated users).
 */
export const CLIENT_ROLES: readonly UserRole[] = ['Client'] as const;

// =============================================================================
// Role Utilities
// =============================================================================

/**
 * Check if a role string is a known UserRole.
 * Unknown roles are handled gracefully (returns false).
 */
export function isKnownRole(role: string): role is UserRole {
  const knownRoles: string[] = [
    'Client',
    'Professional',
    'Admin',
    'SuperAdmin',
    'BusinessAdmin',
    'Moderator',
    'Support',
    'Analyst',
  ];
  return knownRoles.includes(role);
}

/**
 * Check if user has any of the specified roles.
 * Handles unknown roles gracefully.
 */
export function hasAnyRole(
  userRoles: readonly string[],
  allowedRoles: readonly string[]
): boolean {
  return userRoles.some((role) => allowedRoles.includes(role));
}

/**
 * Check if user has all of the specified roles.
 * Handles unknown roles gracefully.
 */
export function hasAllRoles(
  userRoles: readonly string[],
  requiredRoles: readonly string[]
): boolean {
  return requiredRoles.every((role) => userRoles.includes(role));
}

/**
 * Check if user has admin-level access.
 */
export function isAdminUser(userRoles: readonly string[]): boolean {
  return hasAnyRole(userRoles, ADMIN_ROLES);
}

/**
 * Check if user has professional access.
 */
export function isProfessionalUser(userRoles: readonly string[]): boolean {
  return hasAnyRole(userRoles, PROFESSIONAL_ROLES);
}

/**
 * Check if user is a super admin.
 */
export function isSuperAdmin(userRoles: readonly string[]): boolean {
  return hasAnyRole(userRoles, SUPER_ROLES);
}

/**
 * Get the highest priority role for display purposes.
 * Priority: SuperAdmin > Admin > Professional > Client > Unknown
 */
export function getPrimaryRole(userRoles: readonly string[]): string {
  const priority: string[] = [
    'SuperAdmin',
    'Admin',
    'BusinessAdmin',
    'Moderator',
    'Support',
    'Analyst',
    'Professional',
    'Client',
  ];

  for (const role of priority) {
    if (userRoles.includes(role)) {
      return role;
    }
  }

  return userRoles[0] || 'Unknown';
}
