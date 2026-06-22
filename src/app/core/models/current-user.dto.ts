/**
 * Current User Context DTO
 * Represents a context (ADMIN, PROFESSIONAL, or PATIENT) the user can switch to
 */
export interface ContextDto {
  /** Context type */
  type: 'ADMIN' | 'PROFESSIONAL' | 'PATIENT';

  /** Context identifier */
  id: string;

  /** Display name for the context */
  name: string;

  /** Professional profile slug (only for PROFESSIONAL type) */
  slug?: string;
}

/**
 * Current User DTO
 * Response from GET /api/auth/me
 * Contains all user session data including roles, permissions, and contexts
 */
export interface CurrentUserDto {
  /** User ID */
  id: string;

  /** User email */
  email: string;

  /** User full name */
  name: string;

  /** Assigned roles */
  roles: string[];

  /** Granted permissions */
  permissions: string[];

  /** Available contexts (ADMIN, PROFESSIONAL, and/or PATIENT) */
  contexts: ContextDto[];

  /** Default context to use when logging in */
  defaultContext: ContextDto;

  /** Professional profile ID (if user has a professional profile) */
  professionalProfileId?: string;

  /** Professional profile slug (if user has a professional profile) */
  professionalProfileSlug?: string;

  /** True when the user already has a created professional profile */
  hasProfessionalProfile: boolean;

  /** True when the professional profile exists AND is active (not deactivated by admin) */
  isProfessionalActive?: boolean;

  /** True when the professional profile exists AND its license is active. */
  isLicenseActive?: boolean;

  /** True when the license has lapsed (was active before, now inactive) — drives the panel banner/gate. */
  licenseLapsed?: boolean;

  /**
   * Per-session anti-CSRF token (from the JWT's `csrf` claim). Kept in memory by
   * CsrfTokenStore and echoed back in the X-XSRF-TOKEN header on unsafe requests.
   */
  csrfToken?: string;
}
