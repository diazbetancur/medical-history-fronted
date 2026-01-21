import { computed, inject, Injectable } from '@angular/core';
import type {
  AdminMenuItem,
  AdminMenuSection,
} from '../../features/admin/admin-menu.config';
import {
  ADMIN_FOOTER_MENU,
  ADMIN_MENU,
} from '../../features/admin/admin-menu.config';
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
 * Filtered menu section with visibility info
 */
export interface FilteredMenuSection extends Omit<AdminMenuSection, 'items'> {
  items: FilteredMenuItem[];
  /** Whether any item in section is visible */
  hasVisibleItems: boolean;
}

/**
 * Menu Builder Service
 *
 * Dynamically builds navigation menus based on user permissions.
 * Uses signals for reactive updates when session changes.
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
   * Filtered admin menu based on user permissions
   */
  readonly adminMenu = computed<FilteredMenuSection[]>(() => {
    const permissions = this.userPermissions();
    const isSuperAdmin = this.authService.isSuperAdmin();

    return ADMIN_MENU.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        visible: this.isItemVisible(item, permissions, isSuperAdmin),
      })),
      hasVisibleItems: section.items.some((item) =>
        this.isItemVisible(item, permissions, isSuperAdmin),
      ),
    }));
  });

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
   * Footer menu items (navigation back, etc.)
   */
  readonly footerMenu = computed<FilteredMenuItem[]>(() => {
    const permissions = this.userPermissions();
    const isSuperAdmin = this.authService.isSuperAdmin();

    return ADMIN_FOOTER_MENU.map((item) => ({
      ...item,
      visible: this.isItemVisible(item, permissions, isSuperAdmin),
    }));
  });

  /**
   * Count of visible menu items (useful for UI decisions)
   */
  readonly visibleItemCount = computed(() => this.visibleMenuItems().length);

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
   * Internal: Check if menu item is visible
   */
  private isItemVisible(
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
}
