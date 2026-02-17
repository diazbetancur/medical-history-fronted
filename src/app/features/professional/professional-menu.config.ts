/**
 * Professional Area Menu Configuration
 *
 * Defines the navigation menu for professional users.
 * Items are shown based on user's professional-level permissions.
 */

/**
 * Professional menu item interface
 */
export interface ProfessionalMenuItem {
  id: string;
  title: string;
  route: string;
  icon: string;
  requiredPermissions?: string[]; // Empty = visible to all professionals
}

/**
 * Professional menu section interface
 */
export interface ProfessionalMenuSection {
  title: string;
  items: ProfessionalMenuItem[];
}

/**
 * Professional Area Permissions
 *
 * Common permissions for professional users.
 * Naming convention: {Entity}.{Action}
 */
export const PROFESSIONAL_PERMISSIONS = {
  // Profile Management
  PROFILES_VIEW: 'Profiles.View',
  PROFILES_CREATE: 'Profiles.Create',
  PROFILES_EDIT: 'Profiles.Edit',
  PROFILES_DELETE: 'Profiles.Delete',

  // Service Requests
  REQUESTS_VIEW: 'ServiceRequests.View',
  REQUESTS_CREATE: 'ServiceRequests.Create',
  REQUESTS_UPDATE: 'ServiceRequests.Update',
  REQUESTS_CANCEL: 'ServiceRequests.Cancel',

  // Appointments/Agenda (future)
  APPOINTMENTS_VIEW: 'Appointments.View',
  APPOINTMENTS_CREATE: 'Appointments.Create',
  APPOINTMENTS_CANCEL: 'Appointments.Cancel',

  // Patients (future)
  PATIENTS_VIEW: 'Patients.View',
  PATIENTS_CREATE: 'Patients.Create',
  PATIENTS_EDIT: 'Patients.Edit',

  // Notes (future)
  NOTES_VIEW: 'Notes.View',
  NOTES_CREATE: 'Notes.Create',
  NOTES_EDIT: 'Notes.Edit',

  // Attachments (future)
  ATTACHMENTS_VIEW: 'Attachments.View',
  ATTACHMENTS_UPLOAD: 'Attachments.Upload',
  ATTACHMENTS_DELETE: 'Attachments.Delete',
} as const;

/**
 * Professional Area Main Menu
 *
 * Primary navigation for professional dashboard.
 * Items without requiredPermissions are visible to all professionals.
 */
export const PROFESSIONAL_MENU: ProfessionalMenuSection[] = [
  {
    title: 'Principal',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        route: '/dashboard',
        icon: 'dashboard',
        // No permissions required - all professionals can see dashboard
      },
      {
        id: 'profile',
        title: 'Mi Perfil',
        route: '/dashboard/profile',
        icon: 'account_circle',
        requiredPermissions: [PROFESSIONAL_PERMISSIONS.PROFILES_VIEW],
      },
      {
        id: 'requests',
        title: 'Mis Solicitudes',
        route: '/dashboard/requests',
        icon: 'assignment',
        requiredPermissions: [PROFESSIONAL_PERMISSIONS.REQUESTS_VIEW],
      },
    ],
  },
  {
    title: 'Gestión',
    items: [
      {
        id: 'agenda',
        title: 'Agenda',
        route: '/dashboard/agenda',
        icon: 'calendar_month',
        requiredPermissions: [PROFESSIONAL_PERMISSIONS.APPOINTMENTS_VIEW],
      },
      {
        id: 'patients',
        title: 'Pacientes',
        route: '/dashboard/patients',
        icon: 'people',
        requiredPermissions: [PROFESSIONAL_PERMISSIONS.PATIENTS_VIEW],
      },
      {
        id: 'notes',
        title: 'Notas',
        route: '/dashboard/notes',
        icon: 'note',
        requiredPermissions: [PROFESSIONAL_PERMISSIONS.NOTES_VIEW],
      },
      {
        id: 'attachments',
        title: 'Adjuntos',
        route: '/dashboard/attachments',
        icon: 'attach_file',
        requiredPermissions: [PROFESSIONAL_PERMISSIONS.ATTACHMENTS_VIEW],
      },
    ],
  },
  {
    title: 'Configuración',
    items: [
      {
        id: 'settings',
        title: 'Ajustes',
        route: '/dashboard/settings',
        icon: 'settings',
        // No permissions required
      },
    ],
  },
];

/**
 * Professional Footer Menu
 *
 * Navigation items shown in the footer/bottom of sidenav.
 */
export const PROFESSIONAL_FOOTER_MENU: ProfessionalMenuItem[] = [
  {
    id: 'help',
    title: 'Ayuda',
    route: '/help',
    icon: 'help',
  },
  {
    id: 'public-home',
    title: 'Ver Sitio Público',
    route: '/',
    icon: 'public',
  },
];
