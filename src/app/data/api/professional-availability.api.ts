import { inject, Injectable } from '@angular/core';
import type {
  AbsenceDto,
  AbsenceFilters,
  CreateAbsenceDto,
  PaginatedAbsencesResponse,
  UpdateAbsenceDto,
} from '@data/models/professional-absence.models';
import type {
  CreateProfessionalLocationDto,
  ProfessionalLocationDto,
} from '@data/models/professional-location.models';
import type {
  DaySchedule,
  UpdateWeeklyScheduleDto,
  WeeklyScheduleDto,
} from '@data/models/professional-schedule.models';
import { map, Observable } from 'rxjs';
import { ApiClient } from './api-client';

interface WeeklyWindowResponseDto {
  id?: string;
  dayOfWeek: number | string;
  dayName?: string;
  startTime: string;
  endTime: string;
  professionalLocationId?: string | null;
  professionalLocationName?: string | null;
  professionalLocationAddress?: string | null;
  institutionId?: string | null;
  institutionName?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  slotDurationMinutes?: number;
  isActive?: boolean;
}

interface AvailabilityTemplateDto {
  id?: string;
  professionalProfileId?: string;
  timeZone?: string;
  slotMinutes?: number;
  isActive?: boolean;
  dateCreated?: string;
  weeklyWindows?: WeeklyWindowResponseDto[];
  windows?: WeeklyWindowResponseDto[];
}

interface AvailabilityTemplateEnvelopeDto {
  data?: AvailabilityTemplateDto | null;
  result?: AvailabilityTemplateDto | null;
  template?: AvailabilityTemplateDto | null;
}

interface NormalizedWeeklyWindow {
  dayNumber: number;
  startTime: string;
  endTime: string;
  professionalLocationId: string | null;
  professionalLocationName: string | null;
  professionalLocationAddress: string | null;
  slotDurationMinutes?: number;
}

type LooseRecord = Record<string, unknown>;

interface UpsertAvailabilityTemplateDto {
  timeZone: string;
  slotMinutes: number;
  isActive?: boolean;
  weeklyWindows: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    professionalLocationId?: string | null;
    institutionId?: string | null;
  }>;
}

interface SlotItemDto {
  startLocal: string;
  endLocal: string;
  startUtc: string;
  endUtc: string;
  professionalLocationId: string | null;
  professionalLocationName: string | null;
  professionalLocationAddress: string | null;
}

interface SlotResponseDto {
  date: string;
  timeZone: string;
  slotMinutes: number;
  totalSlots: number;
  items: SlotItemDto[];
}

interface AvailabilityExceptionDto {
  id: string;
  professionalProfileId?: string;
  type: 'Absent' | 'Override';
  startDateTime?: string;
  endDateTime?: string;
  overrideStartTime?: string | null;
  overrideEndTime?: string | null;
  reason: string | null;
  institutionId?: string | null;
  institutionName?: string | null;
  professionalLocationId?: string | null;
  professionalLocationName?: string | null;
  dateCreated?: string;
  date?: string;
  typeName?: string;
  overrideWindows?: Array<{
    startTime: string;
    endTime: string;
    locationId: string | null;
    slotDurationMinutes: number;
  }> | null;
}

@Injectable({
  providedIn: 'root',
})
export class ProfessionalAvailabilityApi {
  private readonly apiClient = inject(ApiClient);

  getWeeklySchedule(professionalId: string): Observable<WeeklyScheduleDto> {
    return this.apiClient
      .get<
        AvailabilityTemplateDto | AvailabilityTemplateEnvelopeDto | null
      >(`/professional/${professionalId}/availability/template`)
      .pipe(
        map((response) =>
          this.mapTemplateToWeeklySchedule(professionalId, response),
        ),
      );
  }

  updateWeeklySchedule(
    professionalId: string,
    dto: UpdateWeeklyScheduleDto,
  ): Observable<WeeklyScheduleDto> {
    const payload: UpsertAvailabilityTemplateDto = {
      timeZone: dto.timeZone ?? 'America/Tegucigalpa',
      slotMinutes: dto.defaultSlotDuration ?? 30,
      isActive: dto.isActive ?? true,
      weeklyWindows: dto.days
        .filter((day) => day.isWorkingDay)
        .flatMap((day) =>
          day.timeBlocks.map((block) => ({
            dayOfWeek: this.mapDayEnumToNumber(day.dayOfWeek),
            startTime: block.startTime,
            endTime: block.endTime,
            professionalLocationId: block.professionalLocationId ?? null,
            institutionId: null,
          })),
        ),
    };

    return this.apiClient
      .put<
        AvailabilityTemplateDto | AvailabilityTemplateEnvelopeDto
      >(`/professional/${professionalId}/availability/template`, payload)
      .pipe(
        map((response) =>
          this.mapTemplateToWeeklySchedule(professionalId, response),
        ),
      );
  }

  getProfessionalLocations(all = false): Observable<ProfessionalLocationDto[]> {
    return this.apiClient.get<ProfessionalLocationDto[]>(
      '/professional/locations',
      {
        params: { all: String(all) },
      },
    );
  }

  createProfessionalLocation(
    dto: CreateProfessionalLocationDto,
  ): Observable<ProfessionalLocationDto> {
    return this.apiClient.post<ProfessionalLocationDto>(
      '/professional/locations',
      dto,
    );
  }

  updateProfessionalLocation(
    locationId: string,
    dto: CreateProfessionalLocationDto,
  ): Observable<ProfessionalLocationDto> {
    return this.apiClient.put<ProfessionalLocationDto>(
      `/professional/locations/${locationId}`,
      dto,
    );
  }

  setDefaultProfessionalLocation(
    locationId: string,
  ): Observable<ProfessionalLocationDto> {
    return this.apiClient.patch<ProfessionalLocationDto>(
      `/professional/locations/${locationId}/set-default`,
      {},
    );
  }

  deleteProfessionalLocation(locationId: string): Observable<void> {
    return this.apiClient.delete<void>(`/professional/locations/${locationId}`);
  }

  getAbsences(
    professionalId: string,
    filters?: AbsenceFilters,
  ): Observable<PaginatedAbsencesResponse> {
    const params: Record<string, string> = {};
    if (filters?.startDateTime) params['from'] = filters.startDateTime;
    if (filters?.endDateTime) params['to'] = filters.endDateTime;
    if (filters?.type) params['type'] = filters.type;

    return this.apiClient
      .get<
        AvailabilityExceptionDto[]
      >(`/professional/${professionalId}/availability/exceptions`, { params })
      .pipe(
        map((items) => ({
          items: (items ?? []).map((item) => this.mapExceptionToAbsence(item)),
          total: items?.length ?? 0,
        })),
      );
  }

  createAbsence(
    professionalId: string,
    dto: CreateAbsenceDto,
  ): Observable<AbsenceDto> {
    return this.apiClient
      .post<AvailabilityExceptionDto>(
        `/professional/${professionalId}/availability/exceptions`,
        {
          type: dto.type,
          startDateTime: dto.startDateTime,
          endDateTime: dto.endDateTime,
          overrideStartTime:
            dto.type === 'Override' ? (dto.overrideStartTime ?? null) : null,
          overrideEndTime:
            dto.type === 'Override' ? (dto.overrideEndTime ?? null) : null,
          reason: dto.reason,
          professionalLocationId:
            dto.type === 'Override'
              ? (dto.professionalLocationId ?? null)
              : null,
          institutionId: null,
        },
      )
      .pipe(map((item) => this.mapExceptionToAbsence(item)));
  }

  updateAbsence(
    professionalId: string,
    absenceId: string,
    dto: UpdateAbsenceDto,
  ): Observable<AbsenceDto> {
    void professionalId;
    void absenceId;
    void dto;
    throw new Error(
      'Availability exceptions update is not supported by current contract',
    );
  }

  deleteAbsence(professionalId: string, absenceId: string): Observable<void> {
    return this.apiClient.delete<void>(
      `/professional/${professionalId}/availability/exceptions/${absenceId}`,
    );
  }

  getGeneratedSlots(
    professionalId: string,
    date: string,
    durationMinutes = 30,
  ): Observable<SlotResponseDto> {
    return this.apiClient.get<SlotResponseDto>(
      `/professional/${professionalId}/availability/slots`,
      { params: { date, durationMinutes: String(durationMinutes) } },
    );
  }

  private mapTemplateToWeeklySchedule(
    professionalId: string,
    response: AvailabilityTemplateDto | AvailabilityTemplateEnvelopeDto | null,
  ): WeeklyScheduleDto {
    const template = this.extractTemplate(response);
    const windows = this.normalizeWeeklyWindows(
      template?.weeklyWindows ?? template?.windows ?? [],
    );

    const byDay = new Map<number, NormalizedWeeklyWindow[]>();
    for (const window of windows) {
      const current = byDay.get(window.dayNumber) ?? [];
      current.push(window);
      byDay.set(window.dayNumber, current);
    }

    const daySchedules: DaySchedule[] = [1, 2, 3, 4, 5, 6, 0].map((day) => {
      const dayWindows = byDay.get(day) ?? [];

      return {
        dayOfWeek: this.mapDayNumberToEnum(day),
        isWorkingDay: dayWindows.length > 0,
        timeBlocks: dayWindows.map((window) => ({
          startTime: window.startTime,
          endTime: window.endTime,
          professionalLocationId: window.professionalLocationId,
          professionalLocationName: window.professionalLocationName,
          professionalLocationAddress: window.professionalLocationAddress,
        })),
      };
    });

    return {
      id: template?.id,
      professionalProfileId: template?.professionalProfileId ?? professionalId,
      days: daySchedules,
      defaultSlotDuration:
        template?.slotMinutes ?? windows[0]?.slotDurationMinutes ?? 30,
      timeZone: template?.timeZone ?? 'America/Tegucigalpa',
      isActive: template?.isActive ?? true,
      createdAt: template?.dateCreated,
    };
  }

  private extractTemplate(
    response: AvailabilityTemplateDto | AvailabilityTemplateEnvelopeDto | null,
  ): AvailabilityTemplateDto | null {
    return this.findTemplateCandidate(response);
  }

  private findTemplateCandidate(
    source: unknown,
    depth = 0,
  ): AvailabilityTemplateDto | null {
    if (typeof source === 'string') {
      const parsed = this.tryParseJson(source);
      if (parsed) {
        return this.findTemplateCandidate(parsed, depth + 1);
      }
    }

    if (!source || typeof source !== 'object' || depth > 4) {
      return null;
    }

    const raw = source as LooseRecord;
    const weeklyWindows =
      (raw['weeklyWindows'] as WeeklyWindowResponseDto[] | undefined) ??
      (raw['WeeklyWindows'] as WeeklyWindowResponseDto[] | undefined);
    const windows =
      (raw['windows'] as WeeklyWindowResponseDto[] | undefined) ??
      (raw['Windows'] as WeeklyWindowResponseDto[] | undefined);
    const slotMinutes =
      (raw['slotMinutes'] as number | undefined) ??
      (raw['SlotMinutes'] as number | undefined);

    if (
      Array.isArray(weeklyWindows) ||
      Array.isArray(windows) ||
      typeof slotMinutes === 'number'
    ) {
      return {
        id:
          (raw['id'] as string | undefined) ??
          (raw['Id'] as string | undefined),
        professionalProfileId:
          (raw['professionalProfileId'] as string | undefined) ??
          (raw['ProfessionalProfileId'] as string | undefined),
        timeZone:
          (raw['timeZone'] as string | undefined) ??
          (raw['TimeZone'] as string | undefined),
        slotMinutes,
        isActive:
          (raw['isActive'] as boolean | undefined) ??
          (raw['IsActive'] as boolean | undefined),
        dateCreated:
          (raw['dateCreated'] as string | undefined) ??
          (raw['DateCreated'] as string | undefined),
        weeklyWindows,
        windows,
      };
    }

    for (const value of Object.values(raw)) {
      const found = this.findTemplateCandidate(value, depth + 1);
      if (found) return found;
    }

    return null;
  }

  private normalizeWeeklyWindows(
    windows: WeeklyWindowResponseDto[] | null | undefined,
  ): NormalizedWeeklyWindow[] {
    if (typeof windows === 'string') {
      const parsed = this.tryParseJson(windows);
      if (Array.isArray(parsed)) {
        return this.normalizeWeeklyWindows(parsed as WeeklyWindowResponseDto[]);
      }
      return [];
    }

    if (!Array.isArray(windows)) {
      return [];
    }

    return windows
      .map((window) => {
        const raw = window as WeeklyWindowResponseDto & LooseRecord;
        const normalizedWindow: WeeklyWindowResponseDto = {
          ...window,
          dayOfWeek:
            window.dayOfWeek ??
            (raw['DayOfWeek'] as number | string | undefined) ??
            (raw['day'] as number | string | undefined) ??
            '',
          dayName: window.dayName ?? (raw['DayName'] as string | undefined),
          startTime:
            window.startTime ?? (raw['StartTime'] as string | undefined) ?? '',
          endTime:
            window.endTime ?? (raw['EndTime'] as string | undefined) ?? '',
          professionalLocationId:
            window.professionalLocationId ??
            (raw['ProfessionalLocationId'] as string | null | undefined) ??
            (raw['LocationId'] as string | null | undefined),
          professionalLocationName:
            window.professionalLocationName ??
            (raw['ProfessionalLocationName'] as string | null | undefined) ??
            (raw['LocationName'] as string | null | undefined),
          professionalLocationAddress:
            window.professionalLocationAddress ??
            (raw['ProfessionalLocationAddress'] as string | null | undefined),
          locationId:
            window.locationId ??
            (raw['LocationId'] as string | null | undefined),
          locationName:
            window.locationName ??
            (raw['LocationName'] as string | null | undefined),
          slotDurationMinutes:
            window.slotDurationMinutes ??
            (raw['SlotDurationMinutes'] as number | undefined),
        };

        const dayNumber = this.resolveWindowDay(normalizedWindow);
        const startTime = this.normalizeTime(normalizedWindow.startTime);
        const endTime = this.normalizeTime(normalizedWindow.endTime);

        if (!this.isValidDay(dayNumber) || !startTime || !endTime) {
          return null;
        }

        return {
          dayNumber,
          startTime,
          endTime,
          professionalLocationId:
            normalizedWindow.professionalLocationId ??
            normalizedWindow.locationId ??
            null,
          professionalLocationName:
            normalizedWindow.professionalLocationName ??
            normalizedWindow.locationName ??
            null,
          professionalLocationAddress:
            normalizedWindow.professionalLocationAddress ?? null,
          slotDurationMinutes: normalizedWindow.slotDurationMinutes,
        } as NormalizedWeeklyWindow;
      })
      .filter((window): window is NormalizedWeeklyWindow => !!window);
  }

  private tryParseJson(value: string): unknown | null {
    const text = value.trim();
    if (!text || (text[0] !== '{' && text[0] !== '[')) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  private isValidDay(day: number): boolean {
    return Number.isInteger(day) && day >= 0 && day <= 6;
  }

  private resolveWindowDay(window: WeeklyWindowResponseDto): number {
    const dayValue = window.dayOfWeek;

    if (typeof dayValue === 'number' && Number.isFinite(dayValue)) {
      return dayValue;
    }

    if (typeof dayValue === 'string') {
      const numeric = Number(dayValue);
      if (!Number.isNaN(numeric)) {
        return numeric;
      }

      const byName = this.mapDayNameToNumber(dayValue);
      if (byName !== null) {
        return byName;
      }
    }

    const fromDayName = this.mapDayNameToNumber(window.dayName);
    return fromDayName ?? -1;
  }

  private mapDayNameToNumber(dayName?: string | null): number | null {
    if (!dayName) return null;

    switch (dayName.trim().toLowerCase()) {
      case 'sunday':
      case 'domingo':
        return 0;
      case 'monday':
      case 'lunes':
        return 1;
      case 'tuesday':
      case 'martes':
        return 2;
      case 'wednesday':
      case 'miércoles':
      case 'miercoles':
        return 3;
      case 'thursday':
      case 'jueves':
        return 4;
      case 'friday':
      case 'viernes':
        return 5;
      case 'saturday':
      case 'sábado':
      case 'sabado':
        return 6;
      default:
        return null;
    }
  }

  private normalizeTime(value: string): string {
    if (!value) return value;

    const trimmed = value.trim();
    if (!trimmed) return '';

    const hhmmMatch = trimmed.match(/^(\d{2}:\d{2})/);
    if (hhmmMatch) {
      return hhmmMatch[1];
    }

    return trimmed.length >= 5 ? trimmed.slice(0, 5) : trimmed;
  }

  private mapExceptionToAbsence(item: AvailabilityExceptionDto): AbsenceDto {
    const firstOverride = item.overrideWindows?.[0];
    const startDateTime =
      item.startDateTime ??
      (item.date ? `${item.date}T00:00:00Z` : new Date().toISOString());
    const endDateTime =
      item.endDateTime ??
      (item.date ? `${item.date}T23:59:59Z` : new Date().toISOString());

    return {
      id: item.id,
      professionalProfileId: item.professionalProfileId ?? '',
      type: item.type,
      startDateTime,
      endDateTime,
      overrideStartTime:
        item.overrideStartTime ?? firstOverride?.startTime ?? null,
      overrideEndTime: item.overrideEndTime ?? firstOverride?.endTime ?? null,
      professionalLocationId:
        item.professionalLocationId ?? firstOverride?.locationId ?? null,
      professionalLocationName: item.professionalLocationName ?? null,
      reason: item.reason ?? undefined,
      createdAt: item.dateCreated,
    };
  }

  private mapDayEnumToNumber(day: DaySchedule['dayOfWeek']): number {
    switch (day) {
      case 'SUNDAY':
        return 0;
      case 'MONDAY':
        return 1;
      case 'TUESDAY':
        return 2;
      case 'WEDNESDAY':
        return 3;
      case 'THURSDAY':
        return 4;
      case 'FRIDAY':
        return 5;
      case 'SATURDAY':
        return 6;
      default:
        return 1;
    }
  }

  private mapDayNumberToEnum(day: number): DaySchedule['dayOfWeek'] {
    switch (day) {
      case 0:
        return 'SUNDAY';
      case 1:
        return 'MONDAY';
      case 2:
        return 'TUESDAY';
      case 3:
        return 'WEDNESDAY';
      case 4:
        return 'THURSDAY';
      case 5:
        return 'FRIDAY';
      case 6:
        return 'SATURDAY';
      default:
        return 'MONDAY';
    }
  }
}
