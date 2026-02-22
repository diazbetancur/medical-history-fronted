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
    label: 'Mi Perfil Profesional',
    icon: 'manage_accounts',
    route: '/professional/profile',
    context: 'PROFESSIONAL',
    requiredPermissions: [
      PROFESSIONAL_PERMISSIONS.PROFILES_VIEW,
      PROFESSIONAL_PERMISSIONS.PROFILES_CREATE,
      PROFESSIONAL_PERMISSIONS.PROFILES_UPDATE,
    ],
  },
  {
    label: 'Agenda',
    icon: 'event',
    route: '/professional/appointments',
    context: 'PROFESSIONAL',
    requiredPermissions: [
      PROFESSIONAL_PERMISSIONS.APPOINTMENTS_VIEW_OWN,
      PROFESSIONAL_PERMISSIONS.APPOINTMENTS_CREATE,
    ],
  },
  {
    label: 'Mis Citas',
    icon: 'assignment',
    route: '/professional/appointments',
    context: 'PROFESSIONAL',
    requiredPermissions: [
      PROFESSIONAL_PERMISSIONS.APPOINTMENTS_VIEW,
      PROFESSIONAL_PERMISSIONS.APPOINTMENTS_VIEW_OWN,
    ],
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
  },
  {
    label: 'Solicitudes',
    icon: 'mail',
    route: '/professional/requests',
    context: 'PROFESSIONAL',
    requiredPermissions: [
      PROFESSIONAL_PERMISSIONS.SERVICE_REQUESTS_VIEW,
      PROFESSIONAL_PERMISSIONS.SERVICE_REQUESTS_UPDATE,
    ],
  },
  {
    label: 'Pacientes',
    icon: 'people',
    route: '/professional/patients',
    context: 'PROFESSIONAL',
    requiredPermissions: [
      PROFESSIONAL_PERMISSIONS.PATIENTS_HISTORY_VIEW_OWN,
      PROFESSIONAL_PERMISSIONS.PATIENTS_MEDICATIONS_VIEW_OWN,
      PROFESSIONAL_PERMISSIONS.PATIENTS_ALLERGIES_VIEW_OWN,
      PROFESSIONAL_PERMISSIONS.PATIENTS_EXAMS_VIEW_OWN,
    ],
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
    label: 'Agendar Cita',
    icon: 'event_available',
    route: '/patient/wizard',
    context: 'PATIENT',
    requiredPermissions: ['Appointments.Create', 'Appointments.Slots.View'],
  },
  {
    label: 'Mi Historial',
    icon: 'history',
    route: '/patient/profile',
    context: 'PATIENT',
    requiredPermissions: ['Patients.History.ViewOwn'],
  },
  {
    label: 'Alergias',
    icon: 'warning',
    route: '/patient/allergies',
    context: 'PATIENT',
    requiredPermissions: [
      'Patients.Allergies.ViewOwn',
      'Patients.Allergies.ManageOwn',
    ],
  },
  {
    label: 'Antecedentes',
    icon: 'medical_information',
    route: '/patient/background',
    context: 'PATIENT',
    requiredPermissions: [
      'Patients.Background.ViewOwn',
      'Patients.Background.ManageOwn',
    ],
  },
  {
    label: 'Medicamentos',
    icon: 'medication',
    route: '/patient/medications',
    context: 'PATIENT',
    requiredPermissions: [
      'Patients.Medications.ViewOwn',
      'Patients.Medications.ManageOwn',
    ],
  },
  {
    label: 'Exámenes',
    icon: 'biotech',
    route: '/patient/exams',
    context: 'PATIENT',
    requiredPermissions: ['Patients.Exams.ViewOwn', 'Patients.Exams.ManageOwn'],
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
    label: 'Buscar Profesionales',
    icon: 'search',
    route: '/search',
    context: 'PATIENT',
  },
];

/**
 * Get menu items for a specific context
 */
export function getMenuItemsByContext(context: ContextType): MenuItem[] {
  return MENU_ITEMS.filter((item) => item.context === context);
}
