import { Routes } from '@angular/router';
import {
  authStoreGuard,
  contextGuard,
  permissionStoreGuard,
  professionalProfileGuard,
} from '@core/auth';

/**
 * ============================================================================
 * Directory Pro - Routing MVP
 * ============================================================================
 *
 * Estructura de 3 áreas separadas:
 * - /admin/* → AdminLayoutComponent (contexto ADMIN)
 * - /professional/* → ProfessionalLayoutComponent (contexto PROFESSIONAL)
 * - /patient/* → PatientLayoutComponent (contexto PATIENT)
 *
 * Cada área tiene:
 * - Topbar con usuario + ContextSelector + Logout
 * - Sidebar con navegación específica
 * - RouterOutlet para contenido dinámico
 *
 * Guards:
 * - authStoreGuard: Verifica autenticación (token + user)
 * - contextGuard: Verifica contexto específico (ADMIN/PROFESSIONAL/PATIENT)
 */
export const routes: Routes = [
  // ============================================================================
  // PUBLIC ROUTES (Sin autenticación)
  // ============================================================================
  {
    path: '',
    loadComponent: () =>
      import('./features/public/pages/home/home.page').then(
        (m) => m.HomePageComponent,
      ),
    title: 'Inicio | MediTigo',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/public/pages/login/login.page').then(
        (m) => m.LoginPageComponent,
      ),
    title: 'Iniciar Sesión | MediTigo',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/public/pages/register/register.page').then(
        (m) => m.RegisterPageComponent,
      ),
    title: 'Registro | MediTigo',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/public/pages/forgot-password/forgot-password.page').then(
        (m) => m.ForgotPasswordPageComponent,
      ),
    title: 'Recuperar Contraseña | MediTigo',
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/public/pages/reset-password/reset-password.page').then(
        (m) => m.ResetPasswordPageComponent,
      ),
    title: 'Restablecer Contraseña | MediTigo',
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./features/public/pages/search/search.page').then(
        (m) => m.SearchPageComponent,
      ),
    title: 'Buscar Médicos | MediTigo',
  },
  {
    path: 'pro/:slug',
    loadComponent: () =>
      import('./features/public/pages/profile/profile.page').then(
        (m) => m.ProfilePageComponent,
      ),
    title: 'Perfil Profesional | MediTigo',
  },
  {
    path: 'buscar-medicos',
    redirectTo: 'search',
    pathMatch: 'full',
  },

  // ============================================================================
  // ADMIN AREA (/admin/*)
  // Guards: authStoreGuard + contextGuard('ADMIN')
  // ============================================================================
  {
    path: 'admin',
    canActivate: [authStoreGuard, contextGuard],
    data: {
      requiredContext: 'ADMIN',
    },
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/pages/dashboard/admin-dashboard/admin-dashboard.page').then(
            (m) => m.AdminDashboardPage,
          ),
        title: 'Dashboard Admin | MediTigo',
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/admin/pages/users/users.routes').then(
            (m) => m.usersRoutes,
          ),
      },
      {
        path: 'roles',
        loadChildren: () =>
          import('./features/admin/pages/roles/roles.routes').then(
            (m) => m.rolesRoutes,
          ),
      },
      {
        path: 'specialties',
        canActivate: [permissionStoreGuard],
        data: {
          requiredPermissions: [
            'Catalog.ManageCategories',
            'Profiles.View',
            'Profiles.Update',
          ],
        },
        loadChildren: () =>
          import('./features/admin/pages/specialties/specialties.routes').then(
            (m) => m.specialtiesRoutes,
          ),
      },
      {
        path: 'solicitudes',
        canActivate: [permissionStoreGuard],
        data: {
          requiredPermissions: [
            'Profiles.View',
            'Profiles.Verify',
            'Profiles.Update',
          ],
          defaultFilter: 'pending',
        },
        loadComponent: () =>
          import('./features/admin/pages/professionals-review/professionals-review.page').then(
            (m) => m.ProfessionalsReviewPageComponent,
        ),
        title: 'Solicitudes de Activación - Admin',
      },
      {
        path: 'patient-claims',
        canActivate: [permissionStoreGuard],
        data: {
          requiredPermissions: [
            'Profiles.View',
            'Profiles.Verify',
            'Profiles.Update',
          ],
        },
        loadComponent: () =>
          import('./features/admin/pages/patient-profile-claims/patient-profile-claims.page').then(
            (m) => m.PatientProfileClaimsPage,
          ),
        title: 'Vinculaciones de Pacientes - Admin',
      },
    ],
  },

  // ============================================================================
  // PROFESSIONAL ONBOARDING (standalone, only requires auth)
  // Accessible right after become-professional before context switches
  // ============================================================================
  {
    path: 'professional/onboarding',
    canActivate: [authStoreGuard, contextGuard],
    data: {
      requiredContext: 'PROFESSIONAL',
    },
    loadComponent: () =>
      import('./features/professional/pages/onboarding/professional-onboarding/professional-onboarding.page').then(
        (m) => m.ProfessionalOnboardingPage,
      ),
    title: 'Configurar Perfil Profesional | MediTigo',
  },

  // ============================================================================
  // PROFESSIONAL AREA (/professional/*)
  // Guards: authStoreGuard + contextGuard('PROFESSIONAL') + professionalProfileGuard
  //
  // professionalProfileGuard redirige a /professional/profile en todos los hijos
  // hasta que el usuario complete su perfil.  La ruta /professional/profile queda
  // exenta del chequeo para evitar bucles.
  // ============================================================================
  {
    path: 'professional',
    canActivate: [authStoreGuard, contextGuard, professionalProfileGuard],
    data: {
      requiredContext: 'PROFESSIONAL',
    },
    loadComponent: () =>
      import('./layouts/professional-layout/professional-layout.component').then(
        (m) => m.ProfessionalLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/professional/pages/dashboard/professional-dashboard/professional-dashboard.page').then(
            (m) => m.ProfessionalDashboardPage,
          ),
        title: 'Dashboard Profesional | MediTigo',
      },
      {
        path: 'appointments',
        canActivate: [permissionStoreGuard],
        data: {
          requiredPermissions: ['Appointments.ViewOwn', 'Appointments.Create'],
        },
        loadComponent: () =>
          import('./features/professional/pages/professional-appointments/professional-appointments.page').then(
            (m) => m.ProfessionalAppointmentsPage,
          ),
        title: 'Mis Citas | MediTigo',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/professional/pages/onboarding/professional-onboarding/professional-onboarding.page').then(
            (m) => m.ProfessionalOnboardingPage,
          ),
        title: 'Mi Perfil Profesional | MediTigo',
      },
      {
        path: 'availability',
        canActivate: [permissionStoreGuard],
        data: {
          requiredPermissions: [
            'Appointments.Slots.View',
            'Profiles.View',
            'Profiles.Update',
          ],
        },
        loadComponent: () =>
          import('./features/professional/pages/professional-availability/professional-availability.page').then(
            (m) => m.ProfessionalAvailabilityPage,
          ),
        title: 'Mi Disponibilidad | MediTigo',
      },
      {
        path: 'patients',
        canActivate: [permissionStoreGuard],
        data: {
          requiredPermissions: [
            'Patients.History.ViewOwn',
            'Patients.Medications.ViewOwn',
            'Patients.Allergies.ViewOwn',
            'Patients.Exams.ViewOwn',
            'Patients.Background.ViewOwn',
          ],
        },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/professional/pages/patients/professional-patients-list/professional-patients-list.page').then(
                (m) => m.ProfessionalPatientsListPage,
              ),
            title: 'Mis Pacientes | MediTigo',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/professional/pages/patients/professional-patient-detail/professional-patient-detail.page').then(
                (m) => m.ProfessionalPatientDetailPage,
              ),
            title: 'Detalle de Paciente | MediTigo',
          },
        ],
      },
      {
        path: 'requests',
        canActivate: [permissionStoreGuard],
        data: {
          requiredPermissions: [
            'ServiceRequests.View',
            'ServiceRequests.Update',
          ],
        },
        loadComponent: () =>
          import('./features/professional/pages/professional-requests/professional-requests.page').then(
            (m) => m.ProfessionalRequestsPage,
          ),
        title: 'Solicitudes | MediTigo',
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/professional/pages/professional-reports/professional-reports.page').then(
            (m) => m.ProfessionalReportsPage,
          ),
        title: 'Reportes | MediTigo',
      },
      {
        path: 'agenda',
        redirectTo: 'appointments',
        pathMatch: 'full',
      },
    ],
  },

  // ============================================================================
  // PATIENT AREA (/patient/*)
  // Guards: authStoreGuard + contextGuard('PATIENT')
  // ============================================================================
  {
    path: 'patient',
    canActivate: [authStoreGuard, contextGuard],
    data: {
      requiredContext: 'PATIENT',
    },
    loadComponent: () =>
      import('./patient/layout/patient-layout/patient-layout.component').then(
        (m) => m.PatientLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./patient/pages/home/patient-home/patient-home.component').then(
            (m) => m.PatientHomeComponent,
          ),
        title: 'Inicio | MediTigo',
      },
      {
        path: 'wizard',
        canActivate: [permissionStoreGuard],
        data: {
          requiredPermissions: [
            'Appointments.Create',
            'Appointments.Slots.View',
          ],
        },
        loadComponent: () =>
          import('./patient/pages/wizard/patient-wizard/patient-wizard.page').then(
            (m) => m.PatientWizardPage,
          ),
        title: 'Agenda tu Cita | MediTigo',
      },
      {
        path: 'appointments/:id',
        canActivate: [permissionStoreGuard],
        data: {
          requiredPermissions: ['Appointments.ViewOwn'],
        },
        loadComponent: () =>
          import('./features/agenda/pages/appointment-detail/appointment-detail.page').then(
            (m) => m.AppointmentDetailPageComponent,
          ),
        title: 'Detalle de Cita | MediTigo',
      },
      {
        path: 'appointments',
        canActivate: [permissionStoreGuard],
        data: {
          requiredPermissions: ['Appointments.ViewOwn'],
        },
        loadComponent: () =>
          import('./patient/pages/appointments/patient-appointments/patient-appointments.page').then(
            (m) => m.PatientAppointmentsPageComponent,
          ),
        title: 'Mis Citas | MediTigo',
      },
      {
        path: 'profile',
        canActivate: [permissionStoreGuard],
        data: {
          requiredPermissions: ['Patients.History.ViewOwn'],
        },
        loadComponent: () =>
          import('./patient/profile/pages/profile-page/profile-page.component').then(
            (m) => m.ProfilePageComponent,
          ),
        title: 'Mi Perfil | MediTigo',
      },
      {
        path: 'access-requests',
        loadComponent: () =>
          import('./patient/pages/access-requests/patient-access-requests.page').then(
            (m) => m.PatientAccessRequestsPage,
          ),
        title: 'Solicitudes de acceso | MediTigo',
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./patient/pages/change-password/patient-change-password/patient-change-password.page').then(
            (m) => m.PatientChangePasswordPage,
          ),
        title: 'Cambiar Contraseña | MediTigo',
      },
      {
        path: 'activate-professional',
        loadComponent: () =>
          import('./patient/pages/activate-professional/patient-activate-professional.page').then(
            (m) => m.PatientActivateProfessionalPage,
          ),
        title: 'Activarme como profesional | MediTigo',
      },
      {
        path: 'medications',
        canActivate: [permissionStoreGuard],
        data: {
          requiredPermissions: [
            'Patients.Medications.ViewOwn',
            'Patients.Medications.ManageOwn',
          ],
        },
        loadComponent: () =>
          import('./patient/pages/medications/patient-medications/patient-medications.page').then(
            (m) => m.PatientMedicationsPage,
          ),
        title: 'Mis Medicamentos | MediTigo',
      },
      {
        path: 'allergies',
        canActivate: [permissionStoreGuard],
        data: {
          requiredPermissions: [
            'Patients.Allergies.ViewOwn',
            'Patients.Allergies.ManageOwn',
          ],
        },
        loadComponent: () =>
          import('./patient/pages/allergies/patient-allergies/patient-allergies.page').then(
            (m) => m.PatientAllergiesPage,
          ),
        title: 'Mis Alergias | MediTigo',
      },
      {
        path: 'background',
        canActivate: [permissionStoreGuard],
        data: {
          requiredPermissions: [
            'Patients.Background.ViewOwn',
            'Patients.Background.ManageOwn',
          ],
        },
        loadComponent: () =>
          import('./patient/pages/background/patient-background/patient-background.page').then(
            (m) => m.PatientBackgroundPage,
          ),
        title: 'Mis Antecedentes | MediTigo',
      },
      {
        path: 'exams',
        canActivate: [permissionStoreGuard],
        data: {
          requiredPermissions: [
            'Patients.Exams.ViewOwn',
            'Patients.Exams.ManageOwn',
          ],
        },
        loadComponent: () =>
          import('./patient/pages/exams/patient-exams/patient-exams.page').then(
            (m) => m.PatientExamsPage,
          ),
        title: 'Mis Exámenes | MediTigo',
      },
      {
        path: 'history',
        redirectTo: 'profile',
        pathMatch: 'full',
      },
      {
        path: 'documents',
        redirectTo: 'exams',
        pathMatch: 'full',
      },
      {
        path: 'settings',
        redirectTo: 'profile',
        pathMatch: 'full',
      },
    ],
  },

  // ============================================================================
  // NOTIFICATIONS HISTORY (requires auth)
  // ============================================================================
  {
    path: 'notifications',
    canActivate: [authStoreGuard],
    loadComponent: () =>
      import('./features/notifications/notifications-history.page').then(
        (m) => m.NotificationsHistoryPage,
      ),
    title: 'Notificaciones | MediTigo',
  },

  // ============================================================================
  // LEGAL PAGES
  // ============================================================================
  {
    path: 'terms',
    loadComponent: () =>
      import('./features/legal/legal-page.component').then(
        (m) => m.LegalPageComponent,
      ),
    title: 'Términos de Servicio | MediTigo',
    data: { pageTitle: 'Términos de Servicio' },
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./features/legal/legal-page.component').then(
        (m) => m.LegalPageComponent,
      ),
    title: 'Política de Privacidad | MediTigo',
    data: { pageTitle: 'Política de Privacidad' },
  },
  {
    path: 'help',
    loadComponent: () =>
      import('./features/legal/legal-page.component').then(
        (m) => m.LegalPageComponent,
      ),
    title: 'Ayuda | MediTigo',
    data: { pageTitle: 'Centro de Ayuda' },
  },

  // ============================================================================
  // ERROR ROUTES
  // ============================================================================
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/errors/pages/unauthorized/unauthorized.page').then(
        (m) => m.UnauthorizedPage,
      ),
    title: 'Acceso no autorizado | MediTigo',
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./features/errors/pages/forbidden/forbidden.page').then(
        (m) => m.ForbiddenPage,
      ),
    title: 'Permiso denegado | MediTigo',
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/public/pages/not-found/not-found.page').then(
        (m) => m.NotFoundPageComponent,
      ),
    title: 'Página no encontrada | MediTigo',
  },
];
