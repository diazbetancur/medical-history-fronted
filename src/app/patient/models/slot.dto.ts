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

const HONDURAS_TIMEZONE = 'America/Tegucigalpa';

function getHondurasNowParts(now = new Date()): {
  date: string;
  hour: number;
  minute: number;
} {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: HONDURAS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  const year = String(get('year')).padStart(4, '0');
  const month = String(get('month')).padStart(2, '0');
  const day = String(get('day')).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    hour: get('hour'),
    minute: get('minute'),
  };
}

function parseTimeToMinutes(time: string): number {
  const [hourRaw, minuteRaw] = time.trim().split(':');
  const hour = Number(hourRaw ?? '0');
  const minute = Number(minuteRaw ?? '0');
  return hour * 60 + minute;
}

/**
 * Check if slot is in the past (compared to current time)
 */
export function isSlotInPast(date: string, startTime: string): boolean {
  const nowHn = getHondurasNowParts();

  if (date !== nowHn.date) return false;

  const slotMinutes = parseTimeToMinutes(startTime);
  const nowMinutes = nowHn.hour * 60 + nowHn.minute;

  return slotMinutes <= nowMinutes;
}
