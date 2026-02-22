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
  id: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  locationId: string;
  locationName: string;
  slotDurationMinutes: number;
  isActive: boolean;
}

interface AvailabilityTemplateDto {
  windows: WeeklyWindowResponseDto[];
}

interface UpsertAvailabilityTemplateDto {
  windows: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    locationId: string;
    slotDurationMinutes: number;
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
  date: string;
  type: 'Absent' | 'Override';
  typeName: string;
  reason: string | null;
  overrideWindows: Array<{
    startTime: string;
    endTime: string;
    locationId: string;
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
      windows: dto.days
        .filter((day) => day.isWorkingDay)
        .flatMap((day) =>
          day.timeBlocks.map((block) => ({
            dayOfWeek: this.mapDayEnumToNumber(day.dayOfWeek),
            startTime: block.startTime,
            endTime: block.endTime,
            locationId: block.professionalLocationId ?? '',
            slotDurationMinutes: dto.defaultSlotDuration ?? 30,
          })),
        )
        .filter((window) => !!window.locationId),
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
    if (filters?.startDateTime)
      params['from'] = filters.startDateTime.slice(0, 10);
    if (filters?.endDateTime) params['to'] = filters.endDateTime.slice(0, 10);
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
          date: dto.startDateTime.slice(0, 10),
          type: dto.type,
          reason: dto.reason,
          overrideWindows:
            dto.type === 'Override' &&
            dto.overrideStartTime &&
            dto.overrideEndTime
              ? [
                  {
                    startTime: dto.overrideStartTime,
                    endTime: dto.overrideEndTime,
                    locationId: dto.professionalLocationId ?? '',
                    slotDurationMinutes: 30,
                  },
                ]
              : undefined,
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
    const windows = template?.windows ?? [];
    const daySchedules: DaySchedule[] = [1, 2, 3, 4, 5, 6, 0].map((day) => {
      const dayWindows = windows.filter((window) => window.dayOfWeek === day);
      return {
        dayOfWeek: this.mapDayNumberToEnum(day),
        isWorkingDay: dayWindows.length > 0,
        timeBlocks: dayWindows.map((window) => ({
          startTime: window.startTime,
          endTime: window.endTime,
          professionalLocationId: window.locationId,
          professionalLocationName: window.locationName,
          professionalLocationAddress: null,
        })),
      };
    });

    return {
      id: undefined,
      professionalProfileId: professionalId,
      days: daySchedules,
      defaultSlotDuration: windows[0]?.slotDurationMinutes ?? 30,
      timeZone: 'America/Bogota',
      isActive: true,
      createdAt: undefined,
    };
  }

  private mapExceptionToAbsence(item: AvailabilityExceptionDto): AbsenceDto {
    const firstOverride = item.overrideWindows?.[0];
    return {
      id: item.id,
      professionalProfileId: '',
      type: item.type,
      startDateTime: `${item.date}T00:00:00Z`,
      endDateTime: `${item.date}T23:59:59Z`,
      overrideStartTime: firstOverride?.startTime ?? null,
      overrideEndTime: firstOverride?.endTime ?? null,
      professionalLocationId: firstOverride?.locationId ?? null,
      professionalLocationName: null,
      reason: item.reason ?? undefined,
      createdAt: undefined,
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
