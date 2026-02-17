/**
 * Data API Module - Public exports
 */

// Base Client
export { ApiClient } from './api-client';

// Models
export * from './api-models';

// API Clients
export { AdminUsersApi } from './admin-users.api';
// Admin Users types (selective export to avoid conflicts with api-models)
export { isPaginatedFormatA, isPaginatedFormatB } from './admin-users.types';
export type {
  AdminApiError,
  AdminUserDetailDto,
  AdminUserListDto,
  AdminUsersQueryParams,
  CreateUserDto,
  CreateUserResultDto,
  DeleteUserResultDto,
  PaginatedResponseFormatA,
  PaginatedResponseFormatB,
  PaginationInfo,
  UpdateUserDto,
  UpdateUserResultDto,
  UpdateUserRolesDto,
  UpdateUserRolesResultDto,
} from './admin-users.types';
export { AdminApi } from './admin.api';
export { AppointmentsApi } from './appointments.api';
export type * from './appointments.types';
export { AuthApi } from './auth.api';
export { InstitutionsApi } from './institutions.api';
export { PatientsApi } from './patients.api';
export { ProfessionalAppointmentsApi } from './professional-appointments.api';
export { ProfessionalAvailabilityApi } from './professional-availability.api';
export { ProfessionalApi } from './professional.api';
export { ProfessionalsPublicApi } from './professionals-public.api';
export { PublicApi } from './public.api';
export { SpecialtiesApi } from './specialties.api';
export type * from './roles.api';
export { RolesApi } from './roles.api';
export type * from './users.api';
export { UsersApi } from './users.api';
