/**
 * Admin Menu Configuration
 *
 * Defines the admin navigation menu with permission-based visibility.
 * Items are only shown if user has at least one of the required permissions.
 *
 * Backend Permission Format (from /api/auth/me):
 * - Profiles.View, Profiles.Edit, Profiles.Verify
 * - ServiceRequests.ViewAll, ServiceRequests.Manage
 * - Users.View, Users.Edit, Users.Delete
 * - Roles.View, Roles.Edit
 * - Catalog.ManageCountries, Catalog.ManageCities, Catalog.ManageCategories
 * - Analytics.View
 * - System.ViewLogs, System.ManageSettings
 */

/**
 * Admin menu item configuration
 */
export interface AdminMenuItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Material icon name */
  icon: string;
  /** Router link path */
  route: string;
  /** Permissions required - user needs ANY of these (OR logic) */
  permissionsAny?: string[];
  /** Permissions required - user needs ALL of these (AND logic) */
  permissionsAll?: string[];
  /** Whether route should match exactly for active state */
  exactMatch?: boolean;
  /** Badge count (optional, for notifications) */
  badge?: number;
  /** Tooltip text */
  tooltip?: string;
}

/**
 * Menu section configuration
 */
export interface AdminMenuSection {
  /** Section title (optional) */
  title?: string;
  /** Items in this section */
  items: AdminMenuItem[];
  /** Divider after section */
  dividerAfter?: boolean;
}

// =============================================================================
// Permission Constants - Match backend exactly
// =============================================================================

/**
 * Backend permissions - single source of truth
 * Must match exactly what /api/auth/me returns in permissions[] array
 */
export const PERMISSIONS = {
  // Profiles (Professionals)
  PROFILES_VIEW: 'Profiles.View',
  PROFILES_CREATE: 'Profiles.Create',
  PROFILES_UPDATE: 'Profiles.Update',
  PROFILES_DELETE: 'Profiles.Delete',
  PROFILES_VERIFY: 'Profiles.Verify',
  PROFILES_FEATURE: 'Profiles.Feature',

  // Service Requests
  SERVICE_REQUESTS_VIEW: 'ServiceRequests.View',
  SERVICE_REQUESTS_VIEW_ALL: 'ServiceRequests.ViewAll',
  SERVICE_REQUESTS_UPDATE: 'ServiceRequests.Update',
  SERVICE_REQUESTS_DELETE: 'ServiceRequests.Delete',

  // Catalog Management
  CATALOG_MANAGE_COUNTRIES: 'Catalog.ManageCountries',
  CATALOG_MANAGE_CITIES: 'Catalog.ManageCities',
  CATALOG_MANAGE_CATEGORIES: 'Catalog.ManageCategories',

  // Users Management
  USERS_VIEW: 'Users.View',
  USERS_CREATE: 'Users.Create',
  USERS_UPDATE: 'Users.Update',
  USERS_DELETE: 'Users.Delete',
  USERS_ASSIGN_ROLES: 'Users.AssignRoles',

  // Roles & Permissions
  ROLES_VIEW: 'Roles.View',
  ROLES_CREATE: 'Roles.Create',
  ROLES_UPDATE: 'Roles.Update',
  ROLES_DELETE: 'Roles.Delete',
  ROLES_MANAGE_PERMISSIONS: 'Roles.ManagePermissions',

  // Configuration
  CONFIGURATION_VIEW: 'Configuration.View',
  CONFIGURATION_UPDATE: 'Configuration.Update',
  CONFIGURATION_VIEW_AUDIT_LOG: 'Configuration.ViewAuditLog',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// =============================================================================
// Menu Configuration
// =============================================================================

/**
 * Main admin navigation menu
 */
export const ADMIN_MENU: AdminMenuSection[] = [
  {
    items: [
      {
        id: 'dashboard',
        label: 'Panel Principal',
        icon: 'dashboard',
        route: '/admin',
        exactMatch: true,
        // Dashboard accessible to any admin user
      },
    ],
  },
  {
    title: 'Gestión de Contenido',
    items: [
      {
        id: 'professionals',
        label: 'Profesionales',
        icon: 'people',
        route: '/admin/professionals',
        permissionsAny: [
          PERMISSIONS.PROFILES_VIEW,
          PERMISSIONS.PROFILES_CREATE,
          PERMISSIONS.PROFILES_UPDATE,
          PERMISSIONS.PROFILES_DELETE,
          PERMISSIONS.PROFILES_VERIFY,
          PERMISSIONS.PROFILES_FEATURE,
        ],
        tooltip: 'Revisar y verificar perfiles de profesionales',
      },
      {
        id: 'requests',
        label: 'Solicitudes',
        icon: 'mail',
        route: '/admin/requests',
        permissionsAny: [
          PERMISSIONS.SERVICE_REQUESTS_VIEW_ALL,
          PERMISSIONS.SERVICE_REQUESTS_UPDATE,
          PERMISSIONS.SERVICE_REQUESTS_DELETE,
        ],
        tooltip: 'Gestionar solicitudes de servicio',
      },
    ],
    dividerAfter: true,
  },
  {
    title: 'Configuración del Sistema',
    items: [
      {
        id: 'catalogs',
        label: 'Catálogos',
        icon: 'category',
        route: '/admin/catalogs',
        permissionsAny: [
          PERMISSIONS.CATALOG_MANAGE_COUNTRIES,
          PERMISSIONS.CATALOG_MANAGE_CITIES,
          PERMISSIONS.CATALOG_MANAGE_CATEGORIES,
        ],
        tooltip: 'Gestionar países, ciudades y categorías',
      },
      {
        id: 'users',
        label: 'Usuarios',
        icon: 'manage_accounts',
        route: '/admin/users',
        permissionsAny: [
          PERMISSIONS.USERS_VIEW,
          PERMISSIONS.USERS_CREATE,
          PERMISSIONS.USERS_UPDATE,
          PERMISSIONS.USERS_DELETE,
          PERMISSIONS.USERS_ASSIGN_ROLES,
        ],
        tooltip: 'Administrar usuarios del sistema',
      },
      {
        id: 'roles',
        label: 'Roles y Permisos',
        icon: 'shield',
        route: '/admin/roles',
        permissionsAny: [
          PERMISSIONS.ROLES_VIEW,
          PERMISSIONS.ROLES_CREATE,
          PERMISSIONS.ROLES_UPDATE,
          PERMISSIONS.ROLES_DELETE,
          PERMISSIONS.ROLES_MANAGE_PERMISSIONS,
        ],
        tooltip: 'Configurar roles y permisos',
      },
      {
        id: 'configuration',
        label: 'Configuración',
        icon: 'settings',
        route: '/admin/config',
        permissionsAny: [
          PERMISSIONS.CONFIGURATION_VIEW,
          PERMISSIONS.CONFIGURATION_UPDATE,
          PERMISSIONS.CONFIGURATION_VIEW_AUDIT_LOG,
        ],
        tooltip: 'Configuración del sistema y logs de auditoría',
      },
    ],
    dividerAfter: true,
  },
];

/**
 * Footer navigation items (always visible if user has admin access)
 */
export const ADMIN_FOOTER_MENU: AdminMenuItem[] = [
  {
    id: 'back-dashboard',
    label: 'Volver al Dashboard',
    icon: 'arrow_back',
    route: '/dashboard',
  },
  {
    id: 'back-home',
    label: 'Ir al Inicio',
    icon: 'home',
    route: '/',
  },
];

/**
 * Get all unique permissions required by menu items
 */
export function getAllMenuPermissions(): string[] {
  const permissions = new Set<string>();

  ADMIN_MENU.forEach((section) => {
    section.items.forEach((item) => {
      item.permissionsAny?.forEach((p) => permissions.add(p));
      item.permissionsAll?.forEach((p) => permissions.add(p));
    });
  });

  return Array.from(permissions);
}

/**
 * Get permissions required for a specific route
 */
export function getRoutePermissions(route: string): {
  any: string[];
  all: string[];
} {
  for (const section of ADMIN_MENU) {
    for (const item of section.items) {
      if (item.route === route) {
        return {
          any: item.permissionsAny || [],
          all: item.permissionsAll || [],
        };
      }
    }
  }
  return { any: [], all: [] };
}
