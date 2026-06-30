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
// Selective export: AppointmentStatus is excluded here — the canonical
// (uppercase) version lives in '@data/models/appointment.models' and is
// re-exported from '@data/models'. Exporting the legacy lowercase variant
// from appointments.types would create an ambiguous re-export in '@data/index'.
// Slot types (TimeSlot, GetAvailableSlotsRequest, GetAvailableSlotsResponse) were
// removed in M-08 — use SlotItemDto / SlotResponseDto from ProfessionalAvailabilityApi.
export type {
  Appointment,
  AppointmentClient,
  AppointmentProfessional,
  CancelAppointmentRequest,
  ConfirmAppointmentRequest,
  CreateAppointmentRequest,
  CreateAppointmentResponse,
  ExportIcsRequest,
  UpcomingAppointmentsResponse,
} from './appointments.types';
export { AuthApi } from './auth.api';
export { InstitutionsApi } from './institutions.api';
export { PatientsApi } from './patients.api';
export { ProfessionalAppointmentsApi } from './professional-appointments.api';
export { ProfessionalAvailabilityApi } from './professional-availability.api';
export type { SlotItemDto, SlotResponseDto } from './professional-availability.api';
export { ProfessionalApi } from './professional.api';
export { ProfessionalsPublicApi } from './professionals-public.api';
export { PublicApi } from './public.api';
export type * from './roles.api';
export { RolesApi } from './roles.api';
export { SpecialtiesApi } from './specialties.api';
export type * from './users.api';
export { UsersApi } from './users.api';
export { GoogleCalendarApi } from './google-calendar.api';
export { TenantsApi } from './tenants.api';
export type {
  CalendarConnectionStatus,
  GoogleCalendarConnectResponse,
} from '../models/google-calendar.models';
