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

// Guards - AuthStore (New with Contexts)
export {
  authStoreGuard,
  contextGuard,
  getContextsByType,
  hasAllPermissions as hasAllPermissionsStore,
  hasAnyPermission as hasAnyPermissionStore,
  hasMultipleContexts,
  hasPermission as hasPermissionStore,
  isContextAllowed,
  isCurrentContext,
  permissionStoreGuard,
} from './auth-store.guards';
export type {
  ContextRouteData,
  ContextType,
  PermissionRouteData as PermissionStoreRouteData,
} from './auth-store.guards';

// Guards - Legacy (Role-based)
export { authGuard } from './auth.guard';
export { adminGuard, professionalGuard, roleGuard } from './role.guard';

// Guards - UX Area (Profile-based routing)
export {
  uiProfileAdminGuard,
  uiProfileClientGuard,
  uiProfileProfessionalGuard,
} from './ui-area.guards';

// Services
export { AuthService } from './auth.service';
export { AuthStore } from './auth.store';
export type { AuthState } from './auth.store';
export { PostLoginNavigationService } from './post-login-navigation.service';
export { TokenStorage } from './token-storage.service';
export { UiProfileService } from './ui-profile.service';
export type { UiProfile } from './ui-profile.service';

// Access Control
export * from './access-control';

// Roles
export * from './roles';
