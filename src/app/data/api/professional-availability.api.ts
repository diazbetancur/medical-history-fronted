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
  dayOfWeek: number;
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
      .get<AvailabilityTemplateDto | null>(
        `/professional/${professionalId}/availability/template`,
      )
      .pipe(
        map((template) =>
          this.mapTemplateToWeeklySchedule(professionalId, template),
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
      .put<AvailabilityTemplateDto>(
        `/professional/${professionalId}/availability/template`,
        payload,
      )
      .pipe(
        map((template) =>
          this.mapTemplateToWeeklySchedule(professionalId, template),
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
    template: AvailabilityTemplateDto | null,
  ): WeeklyScheduleDto {
    const windows = template?.weeklyWindows ?? template?.windows ?? [];
    const daySchedules: DaySchedule[] = [1, 2, 3, 4, 5, 6, 0].map((day) => {
      const dayWindows = windows.filter((window) => window.dayOfWeek === day);
      return {
        dayOfWeek: this.mapDayNumberToEnum(day),
        isWorkingDay: dayWindows.length > 0,
        timeBlocks: dayWindows.map((window) => ({
          startTime: window.startTime,
          endTime: window.endTime,
          professionalLocationId:
            window.professionalLocationId ?? window.locationId ?? null,
          professionalLocationName:
            window.professionalLocationName ?? window.locationName ?? null,
          professionalLocationAddress:
            window.professionalLocationAddress ?? null,
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
