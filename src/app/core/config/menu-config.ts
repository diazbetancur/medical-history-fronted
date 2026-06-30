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

  /**
   * If true, this item appears in the mobile bottom navigation bar
   */
  bottomNav?: boolean;
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

  // Profiles (Professionals)
  PROFILES_VIEW: 'Profiles.View',
  PROFILES_VERIFY: 'Profiles.Verify',
  PROFILES_UPDATE: 'Profiles.Update',

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
  APPOINTMENTS_VIEW_OWN: 'Appointments.ViewOwn',
  APPOINTMENTS_VIEW: 'Appointments.View',
  APPOINTMENTS_CREATE: 'Appointments.Create',
  APPOINTMENTS_EDIT: 'Appointments.Edit',
  APPOINTMENTS_SLOTS_VIEW: 'Appointments.Slots.View',
  APPOINTMENTS_CANCEL: 'Appointments.Cancel',
  APPOINTMENTS_CANCEL_OWN: 'Appointments.CancelOwn',

  // Profile / Directory
  PROFILES_VIEW: 'Profiles.View',
  PROFILES_CREATE: 'Profiles.Create',
  PROFILES_UPDATE: 'Profiles.Update',

  // Service Requests (Leads)
  SERVICE_REQUESTS_VIEW: 'ServiceRequests.View',
  SERVICE_REQUESTS_UPDATE: 'ServiceRequests.Update',

  // Patients
  PATIENTS_HISTORY_VIEW_OWN: 'Patients.History.ViewOwn',
  PATIENTS_MEDICATIONS_VIEW_OWN: 'Patients.Medications.ViewOwn',
  PATIENTS_ALLERGIES_VIEW_OWN: 'Patients.Allergies.ViewOwn',
  PATIENTS_EXAMS_VIEW_OWN: 'Patients.Exams.ViewOwn',

  // Manage own history modules
  PATIENTS_BACKGROUND_MANAGE_OWN: 'Patients.Background.ManageOwn',
  PATIENTS_MEDICATIONS_MANAGE_OWN: 'Patients.Medications.ManageOwn',
  PATIENTS_ALLERGIES_MANAGE_OWN: 'Patients.Allergies.ManageOwn',
  PATIENTS_EXAMS_MANAGE_OWN: 'Patients.Exams.ManageOwn',
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
    label: 'Inicio',
    icon: 'dashboard',
    route: '/admin',
    context: 'ADMIN',
    exactMatch: true,
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
    icon: 'pending_actions',
    route: '/admin/solicitudes',
    context: 'ADMIN',
    requiredPermissions: [
      ADMIN_PERMISSIONS.PROFILES_VIEW,
      ADMIN_PERMISSIONS.PROFILES_VERIFY,
      ADMIN_PERMISSIONS.PROFILES_UPDATE,
    ],
  },
  {
    label: 'Vinculaciones',
    icon: 'link',
    route: '/admin/patient-claims',
    context: 'ADMIN',
    requiredPermissions: [
      ADMIN_PERMISSIONS.PROFILES_VIEW,
      ADMIN_PERMISSIONS.PROFILES_VERIFY,
      ADMIN_PERMISSIONS.PROFILES_UPDATE,
    ],
  },
  {
    label: 'Reportes',
    icon: 'assessment',
    route: '/admin/reports',
    context: 'ADMIN',
    requiredPermissions: [
      ADMIN_PERMISSIONS.REPORTS_VIEW,
      ADMIN_PERMISSIONS.REPORTS_VIEW_ALL,
      'Licenses.ViewReports',
    ],
  },
  {
    label: 'Licencias',
    icon: 'card_membership',
    route: '/admin/channel-licenses',
    context: 'ADMIN',
    requiredPermissions: [
      'Licenses.ViewPortfolio',
      'Licenses.Activate',
      'Licenses.Deactivate',
      'Licenses.ViewReports',
    ],
  },
  {
    label: 'Tenants',
    icon: 'apartment',
    route: '/admin/tenants',
    context: 'ADMIN',
    requiredPermissions: ['Tenants.Manage'],
  },
  // ==========================================================================
  // PROFESSIONAL MENU
  // ==========================================================================
  {
    label: 'Inicio',
    icon: 'dashboard',
    route: '/professional',
    context: 'PROFESSIONAL',
    exactMatch: true,
    bottomNav: true,
  },
  {
    label: 'Mi Perfil',
    icon: 'manage_accounts',
    route: '/professional/profile',
    context: 'PROFESSIONAL',
    bottomNav: true,
  },
  {
    label: 'Mis Citas',
    icon: 'assignment',
    route: '/professional/appointments',
    context: 'PROFESSIONAL',
    bottomNav: true,
  },
  {
    label: 'Disponibilidad',
    icon: 'event_available',
    route: '/professional/availability',
    context: 'PROFESSIONAL',
    requiredPermissions: [
      PROFESSIONAL_PERMISSIONS.APPOINTMENTS_SLOTS_VIEW,
      PROFESSIONAL_PERMISSIONS.PROFILES_UPDATE,
      PROFESSIONAL_PERMISSIONS.PROFILES_VIEW,
    ],
    bottomNav: true,
  },
  {
    label: 'Pacientes',
    icon: 'people',
    route: '/professional/patients',
    context: 'PROFESSIONAL',
    bottomNav: true,
  },
  {
    label: 'Reportes',
    icon: 'bar_chart',
    route: '/professional/reports',
    context: 'PROFESSIONAL',
    bottomNav: false,
  },
  // Google Calendar — entrada de menú OCULTA temporalmente hasta terminar los 2 ajustes
  // pendientes + la entrega de permisos. La ruta /professional/calendar sigue ACTIVA
  // (accesible por URL para pruebas/E2E). Re-habilitar = descomentar este bloque.
  // {
  //   label: 'Google Calendar',
  //   icon: 'event_sync',
  //   route: '/professional/calendar',
  //   context: 'PROFESSIONAL',
  //   bottomNav: false,
  // },

  // ==========================================================================
  // PATIENT MENU
  // ==========================================================================
  {
    label: 'Inicio',
    icon: 'home',
    route: '/patient',
    context: 'PATIENT',
    exactMatch: true,
    bottomNav: true,
  },
  {
    label: 'Buscar',
    icon: 'search',
    route: '/search',
    context: 'PATIENT',
    bottomNav: true,
  },
  {
    label: 'Agendar',
    icon: 'event_available',
    route: '/patient/wizard',
    context: 'PATIENT',
    requiredPermissions: ['Appointments.Create', 'Appointments.Slots.View'],
    bottomNav: true,
  },
  {
    label: 'Mis Citas',
    icon: 'assignment',
    route: '/patient/appointments',
    context: 'PATIENT',
    requiredPermissions: ['Appointments.ViewOwn'],
    bottomNav: true,
  },
  {
    label: 'Perfil',
    icon: 'person',
    route: '/patient/profile',
    context: 'PATIENT',
    bottomNav: true,
  },
  {
    label: 'Solicitudes',
    icon: 'pending_actions',
    route: '/patient/access-requests',
    context: 'PATIENT',
  },
  {
    label: 'Grupo Familiar',
    icon: 'family_restroom',
    route: '/patient/family-group',
    context: 'PATIENT',
    requiredPermissions: ['FamilyGroup.View'],
  },
  {
    label: 'Invitaciones',
    icon: 'mail',
    route: '/patient/family-requests',
    context: 'PATIENT',
    requiredPermissions: ['FamilyGroup.View'],
  },
  {
    label: 'Cambiar Contraseña',
    icon: 'lock_reset',
    route: '/patient/change-password',
    context: 'PATIENT',
  },
  {
    label: 'Activarme como profesional',
    icon: 'medical_services',
    route: '/patient/activate-professional',
    context: 'PATIENT',
  },
];

/**
 * Get menu items for a specific context
 */
export function getMenuItemsByContext(context: ContextType): MenuItem[] {
  return MENU_ITEMS.filter((item) => item.context === context);
}
