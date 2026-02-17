import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { UiProfileService } from './ui-profile.service';

/**
 * UI Profile Admin Area Guard
 *
 * **Purpose:** UX layer - redirects users who don't have ADMIN profile
 * **Security:** NOT for security - use permissionGuard for actual access control
 *
 * **Behavior:**
 * - If user has ADMIN profile → allow navigation
 * - If user doesn't have ADMIN profile → redirect to their correct area
 *
 * **Usage in routes:**
 * ```typescript
 * {
 *   path: 'admin',
 *   component: AdminShellComponent,
 *   canActivate: [authGuard, uiProfileAdminGuard], // UX guard first
 *   children: [
 *     {
 *       path: 'users',
 *       component: UsersPageComponent,
 *       canActivate: [permissionGuard(['Users.View'])], // Security guard
 *     }
 *   ]
 * }
 * ```
 *
 * **Guard Layers:**
 * 1. authGuard - Ensures user is authenticated
 * 2. uiProfileAdminGuard - UX redirect if wrong profile (THIS GUARD)
 * 3. permissionGuard - Security enforcement on child routes
 * 4. Backend - Final authority (403 responses)
 *
 * @returns true if user has ADMIN profile, UrlTree to redirect otherwise
 */
export const uiProfileAdminGuard: CanActivateFn = (): boolean | UrlTree => {
  const uiProfile = inject(UiProfileService);
  const router = inject(Router);

  const isAdmin = uiProfile.isAdmin();

  if (isAdmin) {
    // User has ADMIN profile - allow access
    return true;
  }

  // User doesn't have ADMIN profile - redirect to their area
  const correctRoute = uiProfile.baseRoute();
  return router.createUrlTree([correctRoute]);
};

/**
 * UI Profile Professional Area Guard
 *
 * **Purpose:** UX layer - redirects users who don't have PROFESIONAL profile
 * **Security:** NOT for security - use permissionGuard for actual access control
 *
 * **Behavior:**
 * - If user has PROFESIONAL profile → allow navigation
 * - If user doesn't have PROFESIONAL profile → redirect to their correct area
 *
 * **Usage in routes:**
 * ```typescript
 * {
 *   path: 'dashboard',
 *   component: ProfessionalShellComponent,
 *   canActivate: [authGuard, uiProfileProfessionalGuard], // UX guard
 *   children: [
 *     {
 *       path: 'profile',
 *       component: ProfileEditPageComponent,
 *       canActivate: [permissionGuard(['Profiles.View'])], // Security guard
 *     }
 *   ]
 * }
 * ```
 *
 * **Guard Layers:**
 * 1. authGuard - Ensures user is authenticated
 * 2. uiProfileProfessionalGuard - UX redirect if wrong profile (THIS GUARD)
 * 3. permissionGuard - Security enforcement on child routes
 * 4. Backend - Final authority (403 responses)
 *
 * **Note:** This guard is more permissive than professionalGuard (role-based).
 * It allows any user with PROFESIONAL profile (based on permissions), while
 * professionalGuard specifically checks for 'Professional' role.
 *
 * @returns true if user has PROFESIONAL profile, UrlTree to redirect otherwise
 */
export const uiProfileProfessionalGuard: CanActivateFn = ():
  | boolean
  | UrlTree => {
  const uiProfile = inject(UiProfileService);
  const router = inject(Router);

  const isProfessional = uiProfile.isProfessional();

  if (isProfessional) {
    // User has PROFESIONAL profile - allow access
    return true;
  }

  // User doesn't have PROFESIONAL profile - redirect to their area
  const correctRoute = uiProfile.baseRoute();
  return router.createUrlTree([correctRoute]);
};

/**
 * UI Profile Client Area Guard
 *
 * **Purpose:** UX layer - ensures only CLIENTE profile users access certain routes
 * **Security:** NOT typically needed - public routes are accessible to all
 *
 * **Behavior:**
 * - If user has CLIENTE profile → allow navigation
 * - If user has ADMIN/PROFESIONAL profile → redirect to their area
 *
 * **Usage (rare):**
 * ```typescript
 * {
 *   path: 'special-client-only-page',
 *   component: ClientOnlyPageComponent,
 *   canActivate: [uiProfileClientGuard],
 * }
 * ```
 *
 * **Note:** This guard is rarely needed because:
 * - Public pages should be accessible to all users
 * - Admin/Professional users can browse public pages
 * - Only use this if you specifically want to limit a page to CLIENTE users only
 *
 * @returns true if user has CLIENTE profile, UrlTree to redirect otherwise
 */
export const uiProfileClientGuard: CanActivateFn = (): boolean | UrlTree => {
  const uiProfile = inject(UiProfileService);
  const router = inject(Router);

  const isClient = uiProfile.isClient();

  if (isClient) {
    // User has CLIENTE profile - allow access
    return true;
  }

  // User has special profile - redirect to their area
  const correctRoute = uiProfile.baseRoute();
  return router.createUrlTree([correctRoute]);
};
