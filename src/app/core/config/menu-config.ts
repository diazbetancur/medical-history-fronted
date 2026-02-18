import { ContextType } from '@core/auth/auth-store.guards';

/**
 * ============================================================================
 * Menu Configuration for Multi-Context Application
 * ============================================================================
 *
 * Centralized menu configuration for Admin, Professional, and Patient contexts.
 *
 * Menu items are filtered by:
 * 1. Current context (must match item.context)
 * 2. User permissions (must have AT LEAST ONE of requiredPermissions - OR logic)
 *
 * Permission naming convention:
 * - Admin: Users.View, Roles.View, Catalog.ViewInstitutions, etc.
 * - Professional: Appointments.View, Availability.Manage, Patients.View, etc.
 * - Patient: No permissions required (public patient features)
 */

/**
 * Menu Item Configuration
 */
export interface MenuItem {
  /** Display label */
  label: string;

  /** Material icon name */
  icon: string;

  /** Router link path */
  route: string;

  /** Required context to display this item */
  context: ContextType;

  /**
   * Required permissions to display this item
   * If empty/undefined, item is always visible for the context
   * If provided, user must have AT LEAST ONE permission (OR logic)
   */
  requiredPermissions?: string[];

  /**
   * If true, route must match exactly for active state
   */
  exactMatch?: boolean;

  /**
   * If true, this item is a divider (no route/icon/permissions)
   */
  isDivider?: boolean;

  /**
   * Children items (for nested menus)
   */
  children?: MenuItem[];
}

// =============================================================================
// Permission Constants
// =============================================================================

/**
 * Admin Permissions
 */
export const ADMIN_PERMISSIONS = {
  // Institutions/Catalog
  CATALOG_MANAGE_INSTITUTIONS: 'Catalog.ManageInstitutions',
  CATALOG_VIEW_INSTITUTIONS: 'Catalog.ViewInstitutions',
  CATALOG_MANAGE_CATEGORIES: 'Catalog.ManageCategories',

  // Users
  USERS_VIEW: 'Users.View',
  USERS_VIEW_ALL: 'Users.ViewAll',
  USERS_CREATE: 'Users.Create',
  USERS_EDIT: 'Users.Edit',
  USERS_DELETE: 'Users.Delete',

  // Roles
  ROLES_VIEW: 'Roles.View',
  ROLES_VIEW_ALL: 'Roles.ViewAll',
  ROLES_CREATE: 'Roles.Create',
  ROLES_EDIT: 'Roles.Edit',

  // Service Requests
  SERVICE_REQUESTS_VIEW_ALL: 'ServiceRequests.ViewAll',
  SERVICE_REQUESTS_MANAGE: 'ServiceRequests.Manage',

  // Reports
  REPORTS_VIEW: 'Reports.View',
  REPORTS_VIEW_ALL: 'Reports.ViewAll',
  REPORTS_EXPORT: 'Reports.Export',
} as const;

/**
 * Professional Permissions
 */
export const PROFESSIONAL_PERMISSIONS = {
  // Appointments
  APPOINTMENTS_VIEW: 'Appointments.View',
  APPOINTMENTS_CREATE: 'Appointments.Create',
  APPOINTMENTS_EDIT: 'Appointments.Edit',
  APPOINTMENTS_CANCEL: 'Appointments.Cancel',

  // Availability
  AVAILABILITY_VIEW: 'Availability.View',
  AVAILABILITY_MANAGE: 'Availability.Manage',

  // Patients
  PATIENTS_VIEW: 'Patients.View',
  PATIENTS_EDIT: 'Patients.Edit',

  // Notes
  NOTES_VIEW: 'Notes.View',
  NOTES_CREATE: 'Notes.Create',
  NOTES_EDIT: 'Notes.Edit',

  // Files
  FILES_VIEW: 'Files.View',
  FILES_UPLOAD: 'Files.Upload',
  FILES_DELETE: 'Files.Delete',
} as const;

// =============================================================================
// Menu Configuration
// =============================================================================

/**
 * All menu items for Admin, Professional, and Patient contexts
 */
export const MENU_ITEMS: MenuItem[] = [
  // ==========================================================================
  // ADMIN MENU
  // ==========================================================================
  {
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/admin',
    context: 'ADMIN',
    exactMatch: true,
  },
  {
    label: 'Instituciones',
    icon: 'business',
    route: '/admin/institutions',
    context: 'ADMIN',
    requiredPermissions: [
      ADMIN_PERMISSIONS.CATALOG_MANAGE_INSTITUTIONS,
      ADMIN_PERMISSIONS.CATALOG_VIEW_INSTITUTIONS,
    ],
  },
  {
    label: 'Especialidades',
    icon: 'local_hospital',
    route: '/admin/specialties',
    context: 'ADMIN',
    requiredPermissions: [ADMIN_PERMISSIONS.CATALOG_MANAGE_CATEGORIES],
  },
  {
    label: 'Usuarios',
    icon: 'people',
    route: '/admin/users',
    context: 'ADMIN',
    requiredPermissions: [
      ADMIN_PERMISSIONS.USERS_VIEW,
      ADMIN_PERMISSIONS.USERS_VIEW_ALL,
    ],
  },
  {
    label: 'Roles',
    icon: 'admin_panel_settings',
    route: '/admin/roles',
    context: 'ADMIN',
    requiredPermissions: [
      ADMIN_PERMISSIONS.ROLES_VIEW,
      ADMIN_PERMISSIONS.ROLES_VIEW_ALL,
    ],
  },
  {
    label: 'Solicitudes',
    icon: 'assignment',
    route: '/admin/requests',
    context: 'ADMIN',
    requiredPermissions: [ADMIN_PERMISSIONS.SERVICE_REQUESTS_VIEW_ALL],
  },
  {
    label: 'Reportes',
    icon: 'assessment',
    route: '/admin/reports',
    context: 'ADMIN',
    requiredPermissions: [
      ADMIN_PERMISSIONS.REPORTS_VIEW,
      ADMIN_PERMISSIONS.REPORTS_VIEW_ALL,
    ],
  },
  {
    isDivider: true,
    label: '',
    icon: '',
    route: '',
    context: 'ADMIN',
  },
  {
    label: 'Configuración',
    icon: 'settings',
    route: '/admin/settings',
    context: 'ADMIN',
  },

  // ==========================================================================
  // PROFESSIONAL MENU
  // ==========================================================================
  {
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/professional',
    context: 'PROFESSIONAL',
    exactMatch: true,
  },
  {
    label: 'Agenda',
    icon: 'event',
    route: '/professional/agenda',
    context: 'PROFESSIONAL',
    requiredPermissions: [PROFESSIONAL_PERMISSIONS.APPOINTMENTS_VIEW],
  },
  {
    label: 'Mis Citas',
    icon: 'assignment',
    route: '/professional/appointments',
    context: 'PROFESSIONAL',
    requiredPermissions: [PROFESSIONAL_PERMISSIONS.APPOINTMENTS_VIEW],
  },
  {
    label: 'Disponibilidad',
    icon: 'event_available',
    route: '/professional/availability',
    context: 'PROFESSIONAL',
    requiredPermissions: [
      PROFESSIONAL_PERMISSIONS.AVAILABILITY_MANAGE,
      PROFESSIONAL_PERMISSIONS.AVAILABILITY_VIEW,
    ],
  },
  {
    label: 'Pacientes',
    icon: 'people',
    route: '/professional/patients',
    context: 'PROFESSIONAL',
    requiredPermissions: [PROFESSIONAL_PERMISSIONS.PATIENTS_VIEW],
  },

  // ==========================================================================
  // PATIENT MENU
  // ==========================================================================
  {
    label: 'Dashboard',
    icon: 'dashboard',
    route: '/patient',
    context: 'PATIENT',
    exactMatch: true,
  },
  {
    label: 'Buscar Profesionales',
    icon: 'search',
    route: '/patient/professionals',
    context: 'PATIENT',
    // No requiere permisos - siempre visible
  },
  {
    label: 'Mis Citas',
    icon: 'event',
    route: '/patient/appointments',
    context: 'PATIENT',
    // No requiere permisos - siempre visible
  },
  {
    label: 'Mi Historial',
    icon: 'history',
    route: '/patient/history',
    context: 'PATIENT',
  },
  {
    label: 'Mis Documentos',
    icon: 'folder',
    route: '/patient/documents',
    context: 'PATIENT',
  },
  {
    isDivider: true,
    label: '',
    icon: '',
    route: '',
    context: 'PATIENT',
  },
  {
    label: 'Mi Perfil',
    icon: 'person',
    route: '/patient/profile',
    context: 'PATIENT',
  },
  {
    label: 'Cambiar Contraseña',
    icon: 'lock_reset',
    route: '/patient/change-password',
    context: 'PATIENT',
  },
  {
    label: 'Configuración',
    icon: 'settings',
    route: '/patient/settings',
    context: 'PATIENT',
  },
];

/**
 * Get menu items for a specific context
 */
export function getMenuItemsByContext(context: ContextType): MenuItem[] {
  return MENU_ITEMS.filter((item) => item.context === context);
}
