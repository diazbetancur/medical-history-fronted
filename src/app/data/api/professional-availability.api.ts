import { Injectable, inject } from '@angular/core';
import type { TimeSlotDto } from '@data/models/availability.models';
import type {
  AbsenceDto,
  AbsenceFilters,
  CreateAbsenceDto,
  PaginatedAbsencesResponse,
  UpdateAbsenceDto,
} from '@data/models/professional-absence.models';
import type {
  UpdateWeeklyScheduleDto,
  WeeklyScheduleDto,
} from '@data/models/professional-schedule.models';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';

/**
 * Professional Availability API
 *
 * API para gestionar horarios y disponibilidad del profesional.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfessionalAvailabilityApi {
  private readonly apiClient = inject(ApiClient);

  // ============================================================================
  // WEEKLY SCHEDULE (Horario Semanal)
  // ============================================================================

  /**
   * Obtener horario semanal del profesional
   */
  getWeeklySchedule(): Observable<WeeklyScheduleDto> {
    return this.apiClient.get<WeeklyScheduleDto>(
      '/api/professional/availability/schedule',
    );
  }

  /**
   * Actualizar horario semanal
   *
   * @param dto - DTO con horario semanal
   * @returns Observable con horario actualizado
   *
   * @example
   * ```typescript
   * const dto: UpdateWeeklyScheduleDto = {
   *   days: [
   *     {
   *       dayOfWeek: 'MONDAY',
   *       isWorkingDay: true,
   *       timeBlocks: [{ startTime: '09:00', endTime: '13:00' }]
   *     }
   *   ],
   *   defaultSlotDuration: 30,
   *   bufferTime: 5
   * };
   * api.updateWeeklySchedule(dto).subscribe();
   * ```
   */
  updateWeeklySchedule(
    dto: UpdateWeeklyScheduleDto,
  ): Observable<WeeklyScheduleDto> {
    return this.apiClient.put<WeeklyScheduleDto>(
      '/api/professional/availability/schedule',
      dto,
    );
  }

  // ============================================================================
  // ABSENCES (Ausencias/Vacaciones)
  // ============================================================================

  /**
   * Listar ausencias del profesional
   *
   * @param filters - Filtros de búsqueda
   * @returns Observable con ausencias
   *
   * @example
   * ```typescript
   * // Ausencias futuras
   * api.getAbsences({ startDate: '2025-02-01' })
   *
   * // Solo vacaciones
   * api.getAbsences({ type: 'VACATION' })
   * ```
   */
  getAbsences(filters?: AbsenceFilters): Observable<PaginatedAbsencesResponse> {
    const params: any = {};
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.type) params.type = filters.type;

    return this.apiClient.get<PaginatedAbsencesResponse>(
      '/api/professional/availability/absences',
      { params },
    );
  }

  /**
   * Crear ausencia
   *
   * @param dto - DTO con datos de ausencia
   * @returns Observable con ausencia creada
   *
   * @example
   * ```typescript
   * const absence: CreateAbsenceDto = {
   *   type: 'VACATION',
   *   startDate: '2025-03-01',
   *   endDate: '2025-03-15',
   *   reason: 'Vacaciones de verano'
   * };
   * api.createAbsence(absence).subscribe();
   * ```
   */
  createAbsence(dto: CreateAbsenceDto): Observable<AbsenceDto> {
    return this.apiClient.post<AbsenceDto>(
      '/api/professional/availability/absences',
      dto,
    );
  }

  /**
   * Actualizar ausencia
   *
   * @param absenceId - ID de la ausencia
   * @param dto - DTO con datos actualizados
   * @returns Observable con ausencia actualizada
   */
  updateAbsence(
    absenceId: string,
    dto: UpdateAbsenceDto,
  ): Observable<AbsenceDto> {
    return this.apiClient.put<AbsenceDto>(
      `/api/professional/availability/absences/${absenceId}`,
      dto,
    );
  }

  /**
   * Eliminar ausencia
   *
   * @param absenceId - ID de la ausencia
   * @returns Observable vacío
   */
  deleteAbsence(absenceId: string): Observable<void> {
    return this.apiClient.delete<void>(
      `/api/professional/availability/absences/${absenceId}`,
    );
  }

  // ============================================================================
  // GENERATED SLOTS (Slots Generados - Visualización)
  // ============================================================================

  /**
   * Obtener slots generados para un rango de fechas
   *
   * Permite al profesional ver cómo se generarán los slots basados en su horario.
   */
  getGeneratedSlots(
    startDate: string,
    endDate: string,
  ): Observable<Record<string, TimeSlotDto[]>> {
    return this.apiClient.get<Record<string, TimeSlotDto[]>>(
      '/api/professional/availability/slots',
      { params: { startDate, endDate } },
    );
  }
}
