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
export { AuthApi } from './auth.api';
export { ProfessionalApi } from './professional.api';
export { PublicApi } from './public.api';
export type * from './roles.api';
export { RolesApi } from './roles.api';
export type * from './users.api';
export { UsersApi } from './users.api';
