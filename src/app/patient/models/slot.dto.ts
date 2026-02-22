/**
 * Slot DTOs
 *
 * Data Transfer Objects for availability slots API
 */

/**
 * Time Slot DTO
 * GET /api/professional/{id}/availability/slots response item
 */
export interface SlotDto {
  id: string;
  startTime: string; // HH:mm (local)
  endTime: string; // HH:mm (local)
  startUtc: string; // ISO UTC
  endUtc: string; // ISO UTC
  isAvailable: boolean;
  professionalProfileId: string;
  professionalLocationId: string | null;
  professionalLocationName: string | null;
  professionalLocationAddress: string | null;
}

/**
 * Slots Response
 * GET /api/professional/{id}/availability/slots response
 */
export interface SlotsResponseDto {
  date: string; // YYYY-MM-DD
  timeZone: string;
  slotMinutes: number;
  totalSlots: number;
  slots: SlotDto[];
  professionalProfileId: string;
}

/**
 * Mock Professional (for Search Step)
 */
export interface MockProfessionalDto {
  id: string;
  name: string;
  specialty: string;
  city: string;
  photoUrl?: string;
  rating?: number;
}

/**
 * Mock professionals data
 */
export const MOCK_PROFESSIONALS: MockProfessionalDto[] = [
  {
    id: 'prof-1',
    name: 'Dra. María García',
    specialty: 'Cardiología',
    city: 'Madrid',
    rating: 4.8,
  },
  {
    id: 'prof-2',
    name: 'Dr. Juan López',
    specialty: 'Pediatría',
    city: 'Barcelona',
    rating: 4.9,
  },
  {
    id: 'prof-3',
    name: 'Dra. Ana Martínez',
    specialty: 'Dermatología',
    city: 'Valencia',
    rating: 4.7,
  },
  {
    id: 'prof-4',
    name: 'Dr. Carlos Rodríguez',
    specialty: 'Traumatología',
    city: 'Sevilla',
    rating: 4.6,
  },
  {
    id: 'prof-5',
    name: 'Dra. Lucía Fernández',
    specialty: 'Ginecología',
    city: 'Málaga',
    rating: 4.9,
  },
];

/**
 * Format slot time for display
 */
export function formatSlotTime(slot: SlotDto): string {
  return `${slot.startTime} - ${slot.endTime}`;
}

/**
 * Check if slot is in the past (compared to current time)
 */
export function isSlotInPast(date: string, startTime: string): boolean {
  const slotDateTime = new Date(`${date}T${startTime}`);
  return slotDateTime < new Date();
}
