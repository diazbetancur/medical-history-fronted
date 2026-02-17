/**
 * Professional Schedule Models
 *
 * Modelos para gestionar horarios semanales del profesional.
 */

export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

/**
 * Bloque de tiempo en un día específico
 */
export interface TimeBlock {
  /** Hora de inicio (formato HH:mm, ej: "09:00") */
  startTime: string;
  /** Hora de fin (formato HH:mm, ej: "13:00") */
  endTime: string;
}

/**
 * Horario de un día específico
 */
export interface DaySchedule {
  /** Día de la semana */
  dayOfWeek: DayOfWeek;
  /** Si el profesional trabaja este día */
  isWorkingDay: boolean;
  /** Bloques de tiempo (ej: mañana 9-13, tarde 15-19) */
  timeBlocks: TimeBlock[];
}

/**
 * Horario semanal completo del profesional
 */
export interface WeeklyScheduleDto {
  /** ID del horario (si ya existe) */
  id?: string;
  /** ID del perfil profesional */
  professionalProfileId: string;
  /** Horarios por día */
  days: DaySchedule[];
  /** Duración estándar de slots en minutos (default: 30) */
  defaultSlotDuration: number;
  /** Tiempo de buffer entre citas en minutos (default: 0) */
  bufferTime: number;
  /** Fecha de creación */
  createdAt?: string;
  /** Fecha de última actualización */
  updatedAt?: string;
}

/**
 * DTO para crear/actualizar horario semanal
 */
export interface UpdateWeeklyScheduleDto {
  days: DaySchedule[];
  defaultSlotDuration?: number;
  bufferTime?: number;
}

/**
 * Horario semanal por defecto (Lunes-Viernes 9-18)
 */
export const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  {
    dayOfWeek: 'MONDAY',
    isWorkingDay: true,
    timeBlocks: [
      { startTime: '09:00', endTime: '13:00' },
      { startTime: '14:00', endTime: '18:00' },
    ],
  },
  {
    dayOfWeek: 'TUESDAY',
    isWorkingDay: true,
    timeBlocks: [
      { startTime: '09:00', endTime: '13:00' },
      { startTime: '14:00', endTime: '18:00' },
    ],
  },
  {
    dayOfWeek: 'WEDNESDAY',
    isWorkingDay: true,
    timeBlocks: [
      { startTime: '09:00', endTime: '13:00' },
      { startTime: '14:00', endTime: '18:00' },
    ],
  },
  {
    dayOfWeek: 'THURSDAY',
    isWorkingDay: true,
    timeBlocks: [
      { startTime: '09:00', endTime: '13:00' },
      { startTime: '14:00', endTime: '18:00' },
    ],
  },
  {
    dayOfWeek: 'FRIDAY',
    isWorkingDay: true,
    timeBlocks: [
      { startTime: '09:00', endTime: '13:00' },
      { startTime: '14:00', endTime: '18:00' },
    ],
  },
  {
    dayOfWeek: 'SATURDAY',
    isWorkingDay: false,
    timeBlocks: [],
  },
  {
    dayOfWeek: 'SUNDAY',
    isWorkingDay: false,
    timeBlocks: [],
  },
];

/**
 * Helpers para días de la semana
 */
export const DAYS_OF_WEEK: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const DAY_NAMES: Record<DayOfWeek, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};
