import { computed, inject, Injectable } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * UI Profile Types
 * Determines which menu/UI variant to show the user
 */
export type UiProfile = 'CLIENTE' | 'PROFESIONAL' | 'ADMIN';

/**
 * Permission prefixes that indicate admin-level access
 * Used to dynamically compute ADMIN profile regardless of role changes
 */
const ADMIN_PERMISSION_PREFIXES = [
  'Users.', // Users.View, Users.Create, etc.
  'Roles.', // Roles.View, Roles.Create, etc.
  'Catalog.', // Catalog.ManageCountries, etc.
  'ServiceRequests.ViewAll', // Can see all requests (admin-level)
  'ServiceRequests.Delete', // Admin-level action
  'Configuration.', // Configuration.View, etc.
] as const;

/**
 * Permission prefixes that indicate professional area access
 */
const PROFESSIONAL_PERMISSION_PREFIXES = [
  'Profiles.', // Profiles.View, Profiles.Create, etc.
  'ServiceRequests.View', // Can see own requests (professional-level)
  'ServiceRequests.Update', // Can update own requests
] as const;

/**
 * UI Profile Service
 *
 * Computes the user's UI profile (CLIENTE, PROFESIONAL, ADMIN) based on their
 * roles and permissions. This determines which menu/layout variant to show.
 *
 * **Profile Resolution Logic:**
 * 1. **ADMIN**: User has ANY permission starting with admin prefixes
 *    - Examples: Users.View, Roles.Create, Catalog.ManageCategories
 *    - This is permission-based, not role-based (future-proof for new admin roles)
 * 2. **PROFESIONAL**: User has Professional role OR permissions starting with Profiles.*
 *    - Examples: Profiles.View, Profiles.Create
 * 3. **CLIENTE**: Default fallback (authenticated users with no special permissions)
 *
 * **Important:**
 * - This service is for UI/menu selection only
 * - Route guards (permissionGuard, roleGuard) remain the authority for access control
 * - Changes to permissions automatically update the computed profile (reactive signals)
 *
 * @example Usage in component:
 * ```typescript
 * readonly uiProfile = inject(UiProfileService);
 *
 * // In template:
 * @switch (uiProfile.current()) {
 *   @case ('ADMIN') {
 *     <app-admin-menu />
 *   }
 *   @case ('PROFESIONAL') {
 *     <app-professional-menu />
 *   }
 *   @case ('CLIENTE') {
 *     <app-client-menu />
 *   }
 * }
 * ```
 *
 * @example Permission mapping examples:
 * ```typescript
 * // ADMIN profile
 * permissions: ['Users.View', 'Roles.View']
 * // or
 * permissions: ['Catalog.ManageCategories']
 *
 * // PROFESIONAL profile
 * roles: ['Professional']
 * // or
 * permissions: ['Profiles.View', 'Profiles.Create']
 *
 * // CLIENTE profile
 * roles: ['Client']
 * permissions: [] // or none of the above
 * ```
 */
@Injectable({ providedIn: 'root' })
export class UiProfileService {
  private readonly authService = inject(AuthService);

  /**
   * Current user roles (reactive)
   */
  private readonly userRoles = computed(() => this.authService.roles() ?? []);

  /**
   * Current user permissions (reactive)
   */
  private readonly userPermissions = computed(
    () => this.authService.permissions() ?? [],
  );

  /**
   * Check if user has any admin permission
   */
  private readonly hasAdminPermission = computed(() => {
    const permissions = this.userPermissions();

    // SuperAdmin always has admin access (bypass permission checks)
    if (this.userRoles().includes('SuperAdmin')) {
      return true;
    }

    // Check if user has any permission matching admin prefixes
    return permissions.some((permission) =>
      ADMIN_PERMISSION_PREFIXES.some((prefix) => permission.startsWith(prefix)),
    );
  });

  /**
   * Check if user has professional area access
   */
  private readonly hasProfessionalAccess = computed(() => {
    const roles = this.userRoles();
    const permissions = this.userPermissions();

    // Has Professional role
    if (roles.includes('Professional')) {
      return true;
    }

    // Has professional-level permissions
    return permissions.some((permission) =>
      PROFESSIONAL_PERMISSION_PREFIXES.some((prefix) =>
        permission.startsWith(prefix),
      ),
    );
  });

  /**
   * Computed UI profile based on roles and permissions
   *
   * Resolution order:
   * 1. ADMIN - if has admin permissions
   * 2. PROFESIONAL - if has professional role/permissions
   * 3. CLIENTE - default fallback
   */
  readonly current = computed<UiProfile>(() => {
    // Check authenticated
    if (!this.authService.isAuthenticated()) {
      return 'CLIENTE';
    }

    // Admin takes precedence (can manage system)
    if (this.hasAdminPermission()) {
      return 'ADMIN';
    }

    // Professional area (can manage own profile/requests)
    if (this.hasProfessionalAccess()) {
      return 'PROFESIONAL';
    }

    // Default to client profile
    return 'CLIENTE';
  });

  /**
   * Convenience signals for profile checks
   */
  readonly isAdmin = computed(() => this.current() === 'ADMIN');
  readonly isProfessional = computed(() => this.current() === 'PROFESIONAL');
  readonly isClient = computed(() => this.current() === 'CLIENTE');

  /**
   * Get display name for current profile (for debugging/logging)
   */
  readonly displayName = computed(() => {
    switch (this.current()) {
      case 'ADMIN':
        return 'Administrador';
      case 'PROFESIONAL':
        return 'Profesional';
      case 'CLIENTE':
        return 'Cliente';
    }
  });

  /**
   * Get base route path for current profile
   * Useful for redirects after login or profile changes
   */
  readonly baseRoute = computed(() => {
    switch (this.current()) {
      case 'ADMIN':
        return '/admin';
      case 'PROFESIONAL':
        return '/dashboard'; // Professional dashboard
      case 'CLIENTE':
        return '/'; // Public home
    }
  });

  /**
   * Debug info (development only)
   * Shows why a specific profile was selected
   */
  readonly debugInfo = computed(() => {
    if (!this.authService.isAuthenticated()) {
      return { profile: 'CLIENTE', reason: 'Not authenticated' };
    }

    const roles = this.userRoles();
    const permissions = this.userPermissions();
    const hasAdmin = this.hasAdminPermission();
    const hasProfessional = this.hasProfessionalAccess();

    return {
      profile: this.current(),
      roles,
      permissions,
      hasAdminPermission: hasAdmin,
      hasProfessionalAccess: hasProfessional,
      reason: hasAdmin
        ? 'Has admin permissions'
        : hasProfessional
          ? 'Has professional role/permissions'
          : 'Default (client)',
    };
  });
}
