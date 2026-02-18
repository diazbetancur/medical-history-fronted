import { Routes } from '@angular/router';
import { authStoreGuard, contextGuard, permissionStoreGuard } from '@core/auth';

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
    title: 'Inicio - Directory Pro',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/public/pages/login/login.page').then(
        (m) => m.LoginPageComponent,
      ),
    title: 'Iniciar Sesión - Directory Pro',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/public/pages/register/register.page').then(
        (m) => m.RegisterPageComponent,
      ),
    title: 'Registro - Directory Pro',
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/public/pages/forgot-password/forgot-password.page').then(
        (m) => m.ForgotPasswordPageComponent,
      ),
    title: 'Recuperar Contraseña - Directory Pro',
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/public/pages/reset-password/reset-password.page').then(
        (m) => m.ResetPasswordPageComponent,
      ),
    title: 'Restablecer Contraseña - Directory Pro',
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./features/public/pages/search/search.page').then(
        (m) => m.SearchPageComponent,
      ),
    title: 'Buscar Médicos - Directory Pro',
  },
  {
    path: 'pro/:slug',
    loadComponent: () =>
      import('./features/public/pages/profile/profile.page').then(
        (m) => m.ProfilePageComponent,
      ),
    title: 'Perfil Profesional - Directory Pro',
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
          import('./features/admin/pages/dashboard/admin-dashboard.page').then(
            (m) => m.AdminDashboardPage,
          ),
        title: 'Dashboard Admin - Directory Pro',
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
    ],
  },

  // ============================================================================
  // PROFESSIONAL ONBOARDING (standalone, only requires auth)
  // Accessible right after become-professional before context switches
  // ============================================================================
  {
    path: 'professional/onboarding',
    canActivate: [authStoreGuard],
    loadComponent: () =>
      import('./features/professional/pages/onboarding/professional-onboarding.page').then(
        (m) => m.ProfessionalOnboardingPage,
      ),
    title: 'Configura tu Perfil - Directory Pro',
  },

  // ============================================================================
  // PROFESSIONAL AREA (/professional/*)
  // Guards: authStoreGuard + contextGuard('PROFESSIONAL')
  // ============================================================================
  {
    path: 'professional',
    canActivate: [authStoreGuard, contextGuard],
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
          import('./features/professional/pages/dashboard/professional-dashboard.page').then(
            (m) => m.ProfessionalDashboardPage,
          ),
        title: 'Dashboard Profesional - Directory Pro',
      },
      {
        path: 'appointments',
        loadComponent: () =>
          import('./features/professional/pages/professional-appointments.page').then(
            (m) => m.ProfessionalAppointmentsPage,
          ),
        title: 'Mis Citas - Directory Pro',
      },
      {
        path: 'availability',
        loadComponent: () =>
          import('./features/professional/pages/professional-availability.page').then(
            (m) => m.ProfessionalAvailabilityPage,
          ),
        title: 'Mi Disponibilidad - Directory Pro',
      },
      {
        path: 'patients',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/professional/pages/patients/professional-patients-list.page').then(
                (m) => m.ProfessionalPatientsListPage,
              ),
            title: 'Mis Pacientes - Directory Pro',
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/professional/pages/patients/professional-patient-detail.page').then(
                (m) => m.ProfessionalPatientDetailPage,
              ),
            title: 'Detalle de Paciente - Directory Pro',
          },
        ],
      },
      {
        path: 'agenda',
        loadChildren: () =>
          import('./features/agenda/agenda.routes').then((m) => m.agendaRoutes),
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
      import('./patient/layout/patient-layout.component').then(
        (m) => m.PatientLayoutComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./patient/pages/home/patient-home.component').then(
            (m) => m.PatientHomeComponent,
          ),
        title: 'Inicio - Directory Pro',
      },
      {
        path: 'wizard',
        loadComponent: () =>
          import('./patient/pages/wizard/patient-wizard.page').then(
            (m) => m.PatientWizardPage,
          ),
        title: 'Agenda tu Cita - Directory Pro',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./patient/profile/pages/profile-page.component').then(
            (m) => m.ProfilePageComponent,
          ),
        title: 'Mi Perfil - Directory Pro',
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./patient/pages/change-password/patient-change-password.page').then(
            (m) => m.PatientChangePasswordPage,
          ),
        title: 'Cambiar Contraseña - Directory Pro',
      },
      {
        path: 'medications',
        loadComponent: () =>
          import('./patient/pages/medications/patient-medications.page').then(
            (m) => m.PatientMedicationsPage,
          ),
        title: 'Mis Medicamentos - Directory Pro',
      },
      {
        path: 'allergies',
        loadComponent: () =>
          import('./patient/pages/allergies/patient-allergies.page').then(
            (m) => m.PatientAllergiesPage,
          ),
        title: 'Mis Alergias - Directory Pro',
      },
      {
        path: 'background',
        loadComponent: () =>
          import('./patient/pages/background/patient-background.page').then(
            (m) => m.PatientBackgroundPage,
          ),
        title: 'Mis Antecedentes - Directory Pro',
      },
      {
        path: 'exams',
        loadComponent: () =>
          import('./patient/pages/exams/patient-exams.page').then(
            (m) => m.PatientExamsPage,
          ),
        title: 'Mis Exámenes - Directory Pro',
      },
    ],
  },

  // ============================================================================
  // ERROR ROUTES
  // ============================================================================
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/errors/pages/unauthorized.page').then(
        (m) => m.UnauthorizedPage,
      ),
    title: 'No Autorizado - Directory Pro',
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./features/errors/pages/forbidden.page').then(
        (m) => m.ForbiddenPage,
      ),
    title: 'Acceso Denegado - Directory Pro',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
