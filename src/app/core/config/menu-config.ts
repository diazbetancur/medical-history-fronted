/**
 * Admin Menu Configuration
 *
 * Centralized menu configuration with permission-based visibility.
 * Menu items are only shown if user has at least one of the required permissions.
 *
 * Permission naming convention: admin.<module>.<action>
 * - admin.dashboard.view
 * - admin.professionals.view, admin.professionals.edit, admin.professionals.verify
 * - admin.requests.view, admin.requests.manage
 * - admin.stats.view, admin.stats.export
 * - admin.settings.view, admin.settings.edit
 * - admin.users.view, admin.users.edit, admin.users.delete
 */

/**
 * Menu item configuration
 */
export interface MenuItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Material icon name */
  icon: string;
  /** Router link path */
  route: string;
  /** Permissions required (user needs ANY of these) */
  requiredPermissions: string[];
  /** Whether route should match exactly for active state */
  exactMatch?: boolean;
  /** Badge count (optional, for notifications) */
  badge?: number;
  /** Submenu items (optional) */
  children?: MenuItem[];
  /** Whether item is disabled */
  disabled?: boolean;
  /** Tooltip text */
  tooltip?: string;
}

/**
 * Menu section configuration
 */
export interface MenuSection {
  /** Section title (optional, for grouped menus) */
  title?: string;
  /** Items in this section */
  items: MenuItem[];
  /** Divider after section */
  dividerAfter?: boolean;
}

// =============================================================================
// Permission Constants
// =============================================================================

/**
 * All admin permissions - single source of truth
 */
export const ADMIN_PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'admin.dashboard.view',

  // Professionals Management
  PROFESSIONALS_VIEW: 'admin.professionals.view',
  PROFESSIONALS_EDIT: 'admin.professionals.edit',
  PROFESSIONALS_VERIFY: 'admin.professionals.verify',
  PROFESSIONALS_DELETE: 'admin.professionals.delete',

  // Requests/Leads Management
  REQUESTS_VIEW: 'admin.requests.view',
  REQUESTS_MANAGE: 'admin.requests.manage',
  REQUESTS_EXPORT: 'admin.requests.export',

  // Statistics & Reports
  STATS_VIEW: 'admin.stats.view',
  STATS_EXPORT: 'admin.stats.export',

  // Settings
  SETTINGS_VIEW: 'admin.settings.view',
  SETTINGS_EDIT: 'admin.settings.edit',

  // User Management (SuperAdmin)
  USERS_VIEW: 'admin.users.view',
  USERS_EDIT: 'admin.users.edit',
  USERS_DELETE: 'admin.users.delete',

  // System (SuperAdmin)
  SYSTEM_LOGS: 'admin.system.logs',
  SYSTEM_CONFIG: 'admin.system.config',
} as const;

export type AdminPermission =
  (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

// =============================================================================
// Menu Configuration
// =============================================================================

/**
 * Main admin navigation menu
 */
export const ADMIN_MENU: MenuSection[] = [
  {
    items: [
      {
        id: 'dashboard',
        label: 'Panel Principal',
        icon: 'dashboard',
        route: '/admin',
        requiredPermissions: [ADMIN_PERMISSIONS.DASHBOARD_VIEW],
        exactMatch: true,
      },
    ],
  },
  {
    title: 'Gestión',
    items: [
      {
        id: 'professionals',
        label: 'Profesionales',
        icon: 'people',
        route: '/admin/professionals',
        requiredPermissions: [
          ADMIN_PERMISSIONS.PROFESSIONALS_VIEW,
          ADMIN_PERMISSIONS.PROFESSIONALS_EDIT,
          ADMIN_PERMISSIONS.PROFESSIONALS_VERIFY,
        ],
        tooltip: 'Revisar y verificar profesionales',
      },
      {
        id: 'requests',
        label: 'Solicitudes',
        icon: 'mail',
        route: '/admin/requests',
        requiredPermissions: [
          ADMIN_PERMISSIONS.REQUESTS_VIEW,
          ADMIN_PERMISSIONS.REQUESTS_MANAGE,
        ],
        tooltip: 'Gestionar solicitudes de servicio',
      },
    ],
    dividerAfter: true,
  },
  {
    title: 'Análisis',
    items: [
      {
        id: 'stats',
        label: 'Estadísticas',
        icon: 'analytics',
        route: '/admin/stats',
        requiredPermissions: [
          ADMIN_PERMISSIONS.STATS_VIEW,
          ADMIN_PERMISSIONS.STATS_EXPORT,
        ],
        tooltip: 'Ver métricas y reportes',
      },
    ],
    dividerAfter: true,
  },
  {
    title: 'Configuración',
    items: [
      {
        id: 'settings',
        label: 'Configuración',
        icon: 'settings',
        route: '/admin/settings',
        requiredPermissions: [
          ADMIN_PERMISSIONS.SETTINGS_VIEW,
          ADMIN_PERMISSIONS.SETTINGS_EDIT,
        ],
      },
      {
        id: 'users',
        label: 'Usuarios',
        icon: 'manage_accounts',
        route: '/admin/users',
        requiredPermissions: [
          ADMIN_PERMISSIONS.USERS_VIEW,
          ADMIN_PERMISSIONS.USERS_EDIT,
        ],
        tooltip: 'Gestionar usuarios del sistema',
      },
    ],
  },
];

/**
 * Footer navigation items (always visible if user has admin access)
 */
export const ADMIN_FOOTER_MENU: MenuItem[] = [
  {
    id: 'back-dashboard',
    label: 'Volver al Dashboard',
    icon: 'arrow_back',
    route: '/dashboard',
    requiredPermissions: [], // Always visible
  },
  {
    id: 'back-home',
    label: 'Ir al Inicio',
    icon: 'home',
    route: '/',
    requiredPermissions: [], // Always visible
  },
];

/**
 * Get all unique permissions required by menu items
 * Useful for pre-fetching or permission validation
 */
export function getAllMenuPermissions(): string[] {
  const permissions = new Set<string>();

  ADMIN_MENU.forEach((section) => {
    section.items.forEach((item) => {
      item.requiredPermissions.forEach((p) => permissions.add(p));
    });
  });

  return Array.from(permissions);
}

/**
 * Get permissions required for a specific route
 */
export function getRoutePermissions(route: string): string[] {
  for (const section of ADMIN_MENU) {
    for (const item of section.items) {
      if (item.route === route) {
        return [...item.requiredPermissions];
      }
    }
  }
  return [];
}
