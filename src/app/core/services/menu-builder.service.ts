import { computed, inject, Injectable } from '@angular/core';
import type {
  AdminMenuItem,
  AdminMenuSection,
} from '../../features/admin/admin-menu.config';
import {
  ADMIN_FOOTER_MENU,
  ADMIN_MENU,
} from '../../features/admin/admin-menu.config';
import type {
  ProfessionalMenuItem,
  ProfessionalMenuSection,
} from '../../features/professional/professional-menu.config';
import {
  PROFESSIONAL_FOOTER_MENU,
  PROFESSIONAL_MENU,
} from '../../features/professional/professional-menu.config';
import { AuthService } from '../auth/auth.service';
import {
  hasAllPermissions,
  hasAnyAdminPermission,
  hasAnyPermission,
} from '../auth/permission.guard';

/**
 * Filtered menu item with visibility info
 */
export interface FilteredMenuItem extends AdminMenuItem {
  /** Whether item is visible to current user */
  visible: boolean;
}

/**
 * Filtered professional menu item with visibility info
 */
export interface FilteredProfessionalMenuItem extends ProfessionalMenuItem {
  /** Whether item is visible to current user */
  visible: boolean;
}

/**
 * Filtered menu section with visibility info
 */
export interface FilteredMenuSection extends Omit<AdminMenuSection, 'items'> {
  items: FilteredMenuItem[];
  /** Whether any item in section is visible */
  hasVisibleItems: boolean;
}

/**
 * Filtered professional menu section with visibility info
 */
export interface FilteredProfessionalMenuSection extends Omit<
  ProfessionalMenuSection,
  'items'
> {
  items: FilteredProfessionalMenuItem[];
  /** Whether any item in section is visible */
  hasVisibleItems: boolean;
}

/**
 * Menu Builder Service
 *
 * Dynamically builds navigation menus based on user permissions.
 * Uses signals for reactive updates when session changes.
 *
 * **Supported Menus:**
 * - Admin menu: For users with admin permissions
 * - Professional menu: For users with professional permissions
 *
 * @example Usage in component:
 * ```typescript
 * readonly menuBuilder = inject(MenuBuilderService);
 *
 * // In template:
 * @for (section of menuBuilder.adminMenu(); track section.title) {
 *   @if (section.hasVisibleItems) {
 *     // render section
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class MenuBuilderService {
  private readonly authService = inject(AuthService);

  /**
   * Current user permissions (reactive signal)
   */
  private readonly userPermissions = computed(
    () => this.authService.permissions() ?? [],
  );

  /**
   * Check if user has any admin permission at all
   * Use this to determine if admin layout should be accessible
   */
  readonly hasAdminAccess = computed(() => {
    const permissions = this.userPermissions();
    const roles = this.authService.roles();

    // SuperAdmin always has access
    if (roles.includes('SuperAdmin')) return true;

    // Admin role also grants access (for backwards compatibility)
    if (roles.includes('Admin')) return true;

    // Check for any admin-level permission
    return hasAnyAdminPermission(permissions);
  });

  /**
   * Check if user has professional access
   * Use this to determine if professional area should be accessible
   */
  readonly hasProfessionalAccess = computed(() => {
    const roles = this.authService.roles();

    // Professional role grants access
    if (roles.includes('Professional')) return true;

    // Or if user has any professional-level permission
    const permissions = this.userPermissions();
    const professionalPrefixes = ['Profiles.', 'ServiceRequests.'];

    return permissions.some((p) =>
      professionalPrefixes.some((prefix) => p.startsWith(prefix)),
    );
  });

  /**
   * Filtered admin menu based on user permissions
   */
  readonly adminMenu = computed<FilteredMenuSection[]>(() => {
    const permissions = this.userPermissions();
    const isSuperAdmin = this.authService.isSuperAdmin();

    return ADMIN_MENU.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        visible: this.isAdminItemVisible(item, permissions, isSuperAdmin),
      })),
      hasVisibleItems: section.items.some((item) =>
        this.isAdminItemVisible(item, permissions, isSuperAdmin),
      ),
    }));
  });

  /**
   * Filtered professional menu based on user permissions
   */
  readonly professionalMenu = computed<FilteredProfessionalMenuSection[]>(
    () => {
      const permissions = this.userPermissions();

      return PROFESSIONAL_MENU.map((section) => ({
        ...section,
        items: section.items.map((item) => ({
          ...item,
          visible: this.isProfessionalItemVisible(item, permissions),
        })),
        hasVisibleItems: section.items.some((item) =>
          this.isProfessionalItemVisible(item, permissions),
        ),
      }));
    },
  );

  /**
   * Flat list of visible menu items (useful for mobile/simple menus)
   */
  readonly visibleMenuItems = computed<AdminMenuItem[]>(() => {
    const menu = this.adminMenu();
    return menu
      .flatMap((section) => section.items)
      .filter((item) => item.visible);
  });

  /**
   * Flat list of visible professional menu items
   */
  readonly visibleProfessionalMenuItems = computed<ProfessionalMenuItem[]>(
    () => {
      const menu = this.professionalMenu();
      return menu
        .flatMap((section) => section.items)
        .filter((item) => item.visible);
    },
  );

  /**
   * Footer menu items (navigation back, etc.)
   */
  readonly footerMenu = computed<FilteredMenuItem[]>(() => {
    const permissions = this.userPermissions();
    const isSuperAdmin = this.authService.isSuperAdmin();

    return ADMIN_FOOTER_MENU.map((item) => ({
      ...item,
      visible: this.isAdminItemVisible(item, permissions, isSuperAdmin),
    }));
  });

  /**
   * Professional footer menu items
   */
  readonly professionalFooterMenu = computed<FilteredProfessionalMenuItem[]>(
    () => {
      const permissions = this.userPermissions();

      return PROFESSIONAL_FOOTER_MENU.map((item) => ({
        ...item,
        visible: this.isProfessionalItemVisible(item, permissions),
      }));
    },
  );

  /**
   * Count of visible menu items (useful for UI decisions)
   */
  readonly visibleItemCount = computed(() => this.visibleMenuItems().length);

  /**
   * Count of visible professional menu items
   */
  readonly visibleProfessionalItemCount = computed(
    () => this.visibleProfessionalMenuItems().length,
  );

  /**
   * Check if a specific menu item is visible to the user
   */
  isMenuItemVisible(itemId: string): boolean {
    const menu = this.adminMenu();
    for (const section of menu) {
      const item = section.items.find((i) => i.id === itemId);
      if (item) return item.visible;
    }
    return false;
  }

  /**
   * Check if a specific professional menu item is visible
   */
  isProfessionalMenuItemVisible(itemId: string): boolean {
    const menu = this.professionalMenu();
    for (const section of menu) {
      const item = section.items.find((i) => i.id === itemId);
      if (item) return item.visible;
    }
    return false;
  }

  /**
   * Check if user can access a specific route
   * Useful for programmatic navigation checks
   */
  canAccessRoute(route: string): boolean {
    const menu = this.adminMenu();
    for (const section of menu) {
      const item = section.items.find((i) => i.route === route);
      if (item) return item.visible;
    }
    // If route not in menu, check footer
    const footer = this.footerMenu();
    const footerItem = footer.find((i) => i.route === route);
    if (footerItem) return footerItem.visible;

    return false;
  }

  /**
   * Get the first accessible route in admin area
   * Useful for redirecting to a valid page
   */
  getFirstAccessibleRoute(): string {
    const items = this.visibleMenuItems();
    return items.length > 0 ? items[0].route : '/dashboard';
  }

  /**
   * Get the first accessible professional route
   */
  getFirstAccessibleProfessionalRoute(): string {
    const items = this.visibleProfessionalMenuItems();
    return items.length > 0 ? items[0].route : '/dashboard';
  }

  /**
   * Internal: Check if admin menu item is visible
   */
  private isAdminItemVisible(
    item: AdminMenuItem,
    userPermissions: readonly string[],
    isSuperAdmin: boolean,
  ): boolean {
    // SuperAdmin sees everything
    if (isSuperAdmin) return true;

    // No permissions required = visible to any admin user
    if (
      (!item.permissionsAny || item.permissionsAny.length === 0) &&
      (!item.permissionsAll || item.permissionsAll.length === 0)
    ) {
      return true;
    }

    // Check permissionsAny (OR logic)
    if (item.permissionsAny && item.permissionsAny.length > 0) {
      if (!hasAnyPermission(userPermissions, item.permissionsAny)) {
        return false;
      }
    }

    // Check permissionsAll (AND logic)
    if (item.permissionsAll && item.permissionsAll.length > 0) {
      if (!hasAllPermissions(userPermissions, item.permissionsAll)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Internal: Check if professional menu item is visible
   */
  private isProfessionalItemVisible(
    item: ProfessionalMenuItem,
    userPermissions: readonly string[],
  ): boolean {
    // No permissions required = visible to all professionals
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true;
    }

    // Check if user has any of the required permissions
    return hasAnyPermission(userPermissions, item.requiredPermissions);
  }
}
