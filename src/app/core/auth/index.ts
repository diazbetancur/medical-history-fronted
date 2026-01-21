/**
 * Core Auth Module - Public exports
 *
 * Centralizes all authentication and authorization exports.
 */

// Guards - RBAC (Recommended)
export {
  adminAreaGuard,
  hasAllPermissions,
  hasAnyAdminPermission,
  hasAnyPermission,
  hasPermission,
  permissionGuard,
} from './rbac.guards';
export type { PermissionRouteData } from './rbac.guards';

// Guards - Legacy (Role-based)
export { authGuard } from './auth.guard';
export { adminGuard, professionalGuard, roleGuard } from './role.guard';

// Services
export { AuthService } from './auth.service';
export { TokenStorage } from './token-storage.service';

// Access Control
export * from './access-control';

// Roles
export * from './roles';
