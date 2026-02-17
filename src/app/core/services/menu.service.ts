import { computed, inject, Injectable, Signal } from '@angular/core';
import { ContextType } from '@core/auth/auth-store.guards';
import { AuthStore } from '@core/auth/auth.store';
import { MENU_ITEMS, MenuItem } from '@core/config/menu-config';

/**
 * MenuService
 *
 * Provides dynamic menu items filtered by:
 * - User's current context (exact match)
 * - User's permissions (OR logic - needs at least ONE required permission)
 *
 * Usage:
 * ```typescript
 * menuService = inject(MenuService);
 * menuItems = this.menuService.filteredMenuItems();
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly authStore = inject(AuthStore);

  /**
   * All available menu items (unfiltered)
   */
  readonly allMenuItems: MenuItem[] = MENU_ITEMS;

  /**
   * Menu items filtered by current context and user permissions
   *
   * Filtering logic:
   * 1. Context must match exactly
   * 2. If requiredPermissions is empty/undefined → always visible
   * 3. If requiredPermissions exists → user must have at least ONE permission (OR logic)
   */
  readonly filteredMenuItems: Signal<MenuItem[]> = computed(() => {
    const currentContext = this.authStore.currentContext();
    const userPermissions = this.authStore.userPermissions();

    if (!currentContext) {
      return [];
    }

    return this.filterMenuItemsByContextAndPermissions(
      currentContext.type,
      userPermissions,
    );
  });

  /**
   * Filter menu items by context and permissions
   *
   * @param context - Current user context
   * @param permissions - User's permission strings
   * @returns Filtered menu items
   */
  private filterMenuItemsByContextAndPermissions(
    context: ContextType,
    permissions: string[],
  ): MenuItem[] {
    return this.allMenuItems.filter((item) => {
      // 1. Context must match
      if (item.context !== context) {
        return false;
      }

      // 2. Dividers are always visible (for their context)
      if (item.isDivider) {
        return true;
      }

      // 3. Items without required permissions are always visible
      if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
        return true;
      }

      // 4. User must have at least ONE of the required permissions (OR logic)
      return item.requiredPermissions.some((requiredPerm) =>
        permissions.includes(requiredPerm),
      );
    });
  }

  /**
   * Get menu items for a specific context (for testing/debugging)
   */
  getMenuItemsByContext(context: ContextType): MenuItem[] {
    return this.allMenuItems.filter((item) => item.context === context);
  }

  /**
   * Check if a route is accessible based on current permissions
   *
   * @param route - Route to check
   * @returns True if user has permissions to access this route
   */
  canAccessRoute(route: string): boolean {
    const currentContext = this.authStore.currentContext();
    const userPermissions = this.authStore.userPermissions();

    if (!currentContext) {
      return false;
    }

    const menuItem = this.allMenuItems.find(
      (item) => item.route === route && item.context === currentContext.type,
    );

    if (!menuItem) {
      return false;
    }

    // No required permissions = always accessible
    if (
      !menuItem.requiredPermissions ||
      menuItem.requiredPermissions.length === 0
    ) {
      return true;
    }

    // User needs at least ONE required permission
    return menuItem.requiredPermissions.some((perm) =>
      userPermissions.includes(perm),
    );
  }
}
