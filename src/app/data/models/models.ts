/**
 * Base models for the application.
 * Add specific models as needed.
 */

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Professional {
  id: string;
  slug: string;
  name: string;
  email: string;
  phone?: string;
  specialty: string;
  description?: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// Service Request (Lead) Models
// =============================================================================

export type ServiceRequestStatus =
  | 'PENDING'
  | 'CONTACTED'
  | 'CLOSED'
  | 'REJECTED';

export interface ServiceRequestClient {
  name: string;
  email: string;
  phone?: string;
}

export interface ServiceRequestService {
  id: string;
  name: string;
}

export interface ServiceRequest {
  id: string;
  professionalId: string;
  professional?: {
    id: string;
    name: string;
    slug: string;
  };
  client: ServiceRequestClient;
  service?: ServiceRequestService;
  message: string;
  status: ServiceRequestStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateServiceRequestPayload {
  professionalId: string;
  serviceId?: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export interface CreateServiceRequestResponse {
  id: string;
  status: ServiceRequestStatus;
}

export interface UpdateRequestStatusPayload {
  status: ServiceRequestStatus;
}

// =============================================================================
// User Models
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  avatar?: string;
  createdAt: Date;
}
