import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  ABSENCE_TYPE_NAMES,
  type AbsenceType,
  type CreateAbsenceDto,
} from '@data/models/professional-absence.models';
import {
  DAYS_OF_WEEK,
  DAY_NAMES,
  DEFAULT_WEEKLY_SCHEDULE,
  type DaySchedule,
  type TimeBlock,
  type WeeklyScheduleDto,
} from '@data/models/professional-schedule.models';
import { ProfessionalAvailabilityStore } from '@data/stores/professional-availability.store';
import { ConfirmDialogComponent } from '@shared/ui';

@Component({
  selector: 'app-professional-availability-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatDatepickerModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="availability-page">
      <header class="page-header">
        <h1>Mi Disponibilidad</h1>
      </header>

      @if (store.isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando información...</p>
        </div>
      } @else {
        <mat-card class="schedule-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>schedule</mat-icon>
              Horario Semanal
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <form [formGroup]="scheduleForm">
              <mat-accordion>
                @for (day of daysOfWeek; track day; let i = $index) {
                  <mat-expansion-panel
                    [expanded]="
                      getDayScheduleFormGroup(i).get('isWorkingDay')?.value
                    "
                  >
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <mat-slide-toggle
                          [formControl]="getIsWorkingDayControl(i)"
                          (click)="$event.stopPropagation()"
                        >
                          {{ dayNames[day] }}
                        </mat-slide-toggle>
                      </mat-panel-title>
                      <mat-panel-description>
                        @if (
                          getDayScheduleFormGroup(i).get('isWorkingDay')?.value
                        ) {
                          <span class="working-hours">{{
                            getWorkingHoursSummary(i)
                          }}</span>
                        } @else {
                          <span class="no-work">No laborable</span>
                        }
                      </mat-panel-description>
                    </mat-expansion-panel-header>

                    @if (
                      getDayScheduleFormGroup(i).get('isWorkingDay')?.value
                    ) {
                      <div
                        class="time-blocks"
                        [formGroup]="getDayScheduleFormGroup(i)"
                      >
                        <h4>Bloques de tiempo</h4>

                        <div formArrayName="timeBlocks">
                          @for (
                            block of getTimeBlocksFormArray(i).controls;
                            track $index;
                            let j = $index
                          ) {
                            <div class="time-block" [formGroupName]="j">
                              <mat-form-field appearance="outline">
                                <mat-label>Inicio</mat-label>
                                <input
                                  matInput
                                  type="time"
                                  formControlName="startTime"
                                />
                              </mat-form-field>

                              <mat-icon class="arrow">arrow_forward</mat-icon>

                              <mat-form-field appearance="outline">
                                <mat-label>Fin</mat-label>
                                <input
                                  matInput
                                  type="time"
                                  formControlName="endTime"
                                />
                              </mat-form-field>

                              <mat-form-field
                                appearance="outline"
                                class="location-field"
                              >
                                <mat-label>Sede</mat-label>
                                <mat-select
                                  formControlName="professionalLocationId"
                                >
                                  @for (
                                    location of store.locations();
                                    track location.id
                                  ) {
                                    <mat-option [value]="location.id">
                                      {{ location.name }}
                                    </mat-option>
                                  }
                                </mat-select>
                              </mat-form-field>

                              <button
                                mat-icon-button
                                color="warn"
                                (click)="removeTimeBlock(i, j)"
                                type="button"
                              >
                                <mat-icon>delete</mat-icon>
                              </button>
                            </div>
                          }
                        </div>

                        <button
                          mat-stroked-button
                          color="primary"
                          (click)="addTimeBlock(i)"
                          type="button"
                        >
                          <mat-icon>add</mat-icon>
                          Agregar bloque
                        </button>
                      </div>
                    }
                  </mat-expansion-panel>
                }
              </mat-accordion>

              <div class="slot-config">
                <mat-form-field appearance="outline">
                  <mat-label>Duración de slots (minutos)</mat-label>
                  <input
                    matInput
                    type="number"
                    formControlName="defaultSlotDuration"
                    min="5"
                    max="240"
                    step="5"
                  />
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Zona horaria</mat-label>
                  <input matInput type="text" formControlName="timeZone" />
                  <mat-hint>Ejemplo: America/Bogota</mat-hint>
                </mat-form-field>

                <mat-slide-toggle formControlName="isActive"
                  >Plantilla activa</mat-slide-toggle
                >
              </div>
            </form>
          </mat-card-content>

          <mat-card-actions>
            <button
              mat-raised-button
              color="primary"
              (click)="saveSchedule()"
              [disabled]="store.isSaving() || scheduleForm.invalid"
            >
              @if (store.isSaving()) {
                <mat-spinner diameter="20"></mat-spinner>
                <span>Guardando...</span>
              } @else {
                <ng-container>
                  <mat-icon>save</mat-icon>
                  <span>Guardar Horario</span>
                </ng-container>
              }
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="absences-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>event_busy</mat-icon>
              Excepciones de Disponibilidad
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            @if (!showAbsenceForm()) {
              <button
                mat-raised-button
                color="primary"
                (click)="showAbsenceForm.set(true)"
              >
                <mat-icon>add</mat-icon>
                Agregar Excepción
              </button>
            } @else {
              <div class="absence-form">
                <h4>Nueva Excepción</h4>
                <form [formGroup]="absenceForm">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Tipo</mat-label>
                      <mat-select formControlName="type">
                        @for (type of absenceTypes; track type) {
                          <mat-option [value]="type">{{
                            absenceTypeNames[type]
                          }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Fecha desde</mat-label>
                      <input
                        matInput
                        [matDatepicker]="startPicker"
                        formControlName="startDate"
                      />
                      <mat-datepicker-toggle
                        matIconSuffix
                        [for]="startPicker"
                      ></mat-datepicker-toggle>
                      <mat-datepicker #startPicker></mat-datepicker>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Fecha hasta</mat-label>
                      <input
                        matInput
                        [matDatepicker]="endPicker"
                        formControlName="endDate"
                      />
                      <mat-datepicker-toggle
                        matIconSuffix
                        [for]="endPicker"
                      ></mat-datepicker-toggle>
                      <mat-datepicker #endPicker></mat-datepicker>
                    </mat-form-field>
                  </div>

                  @if (isOverrideType()) {
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Hora inicio (override)</mat-label>
                        <input
                          matInput
                          type="time"
                          formControlName="overrideStartTime"
                        />
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Hora fin (override)</mat-label>
                        <input
                          matInput
                          type="time"
                          formControlName="overrideEndTime"
                        />
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Sede</mat-label>
                        <mat-select formControlName="professionalLocationId">
                          @for (
                            location of store.locations();
                            track location.id
                          ) {
                            <mat-option [value]="location.id">{{
                              location.name
                            }}</mat-option>
                          }
                        </mat-select>
                      </mat-form-field>
                    </div>
                  }

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Motivo (opcional)</mat-label>
                    <textarea
                      matInput
                      formControlName="reason"
                      rows="2"
                      maxlength="200"
                    ></textarea>
                    <mat-hint align="end"
                      >{{ absenceForm.get('reason')?.value?.length || 0 }} /
                      200</mat-hint
                    >
                  </mat-form-field>

                  <div class="form-actions">
                    <button
                      mat-raised-button
                      color="primary"
                      (click)="createAbsence()"
                      [disabled]="store.isSaving() || absenceForm.invalid"
                    >
                      <mat-icon>save</mat-icon>
                      Guardar
                    </button>
                    <button mat-button (click)="cancelAbsenceForm()">
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            }

            @if (store.futureAbsences().length > 0) {
              <div class="absences-list">
                <h4>Excepciones Programadas</h4>
                @for (absence of store.futureAbsences(); track absence.id) {
                  <mat-card class="absence-item">
                    <mat-card-content>
                      <div class="absence-header">
                        <mat-chip [color]="getAbsenceChipColor(absence.type)">
                          {{ absenceTypeNames[absence.type] }}
                        </mat-chip>
                        <button
                          mat-icon-button
                          color="warn"
                          (click)="deleteAbsence(absence.id)"
                        >
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>

                      <div class="absence-dates">
                        <mat-icon>event</mat-icon>
                        <span>
                          {{ formatDateTime(absence.startDateTime) }} -
                          {{ formatDateTime(absence.endDateTime) }}
                        </span>
                      </div>

                      @if (absence.type === 'Override') {
                        <div class="absence-reason">
                          <mat-icon>schedule</mat-icon>
                          <span>
                            Horario: {{ absence.overrideStartTime }} -
                            {{ absence.overrideEndTime }}
                            @if (absence.professionalLocationName) {
                              · {{ absence.professionalLocationName }}
                            }
                          </span>
                        </div>
                      }

                      @if (absence.reason) {
                        <div class="absence-reason">
                          <mat-icon>note</mat-icon>
                          <span>{{ absence.reason }}</span>
                        </div>
                      }
                    </mat-card-content>
                  </mat-card>
                }
              </div>
            } @else if (!showAbsenceForm()) {
              <div class="empty-absences">
                <mat-icon>check_circle</mat-icon>
                <p>No tienes excepciones programadas</p>
              </div>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [
    `
      .availability-page {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: 24px;

        h1 {
          margin: 0;
          font-size: 32px;
          font-weight: 500;
        }
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px 24px;

        p {
          margin-top: 16px;
          color: var(--color-text-secondary);
        }
      }

      .schedule-card,
      .absences-card {
        margin-bottom: 24px;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      .working-hours {
        color: var(--color-success);
        font-weight: 500;
      }

      .no-work {
        color: var(--color-text-disabled);
      }

      .time-blocks {
        padding: 16px;

        h4 {
          margin: 0 0 16px 0;
          font-size: 14px;
          font-weight: 500;
          color: var(--color-text-primary);
        }

        .time-block {
          display: grid;
          grid-template-columns: 1fr auto 1fr 1.4fr auto;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;

          .arrow {
            color: var(--color-text-disabled);
          }
        }
      }

      .slot-config {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 16px;
        margin-top: 24px;
        align-items: center;
      }

      mat-card-actions {
        padding: 16px;

        button {
          mat-icon,
          mat-spinner {
            margin-right: 8px;
          }
        }
      }

      .absence-form {
        padding: 16px;
        background: var(--color-background-alt);
        border-radius: 8px;
        margin-bottom: 24px;

        h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 500;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .full-width {
          width: 100%;
        }

        .form-actions {
          display: flex;
          gap: 12px;

          button mat-icon {
            margin-right: 8px;
          }
        }
      }

      .absences-list {
        margin-top: 24px;

        h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 500;
        }

        .absence-item {
          margin-bottom: 12px;

          .absence-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }

          .absence-dates,
          .absence-reason {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            color: var(--color-text-primary);

            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
            }
          }
        }
      }

      .empty-absences {
        text-align: center;
        padding: 32px;
        color: var(--color-text-secondary);

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
          margin-bottom: 8px;
          color: var(--color-text-disabled);
        }
      }

      @media (max-width: 768px) {
        .availability-page {
          padding: 16px;
        }

        .time-blocks .time-block,
        .slot-config,
        .absence-form .form-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ProfessionalAvailabilityPage implements OnInit {
  protected readonly store = inject(ProfessionalAvailabilityStore);
  protected readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  protected readonly daysOfWeek = DAYS_OF_WEEK;
  protected readonly dayNames = DAY_NAMES;
  protected readonly absenceTypes: AbsenceType[] = ['Absent', 'Override'];
  protected readonly absenceTypeNames = ABSENCE_TYPE_NAMES;

  protected readonly showAbsenceForm = signal(false);

  protected scheduleForm!: FormGroup;
  protected absenceForm!: FormGroup;

  ngOnInit(): void {
    this.initScheduleForm();
    this.initAbsenceForm();
    this.store.initialize();

    effect(() => {
      const schedule = this.store.weeklySchedule();
      if (schedule) {
        this.patchScheduleForm(schedule);
      }
    });
  }

  protected isOverrideType(): boolean {
    return this.absenceForm.get('type')?.value === 'Override';
  }

  protected getLocationName(locationId: string | null | undefined): string {
    if (!locationId) return 'Consultorio privado';
    const location = this.store
      .locations()
      .find((item) => item.id === locationId);
    return location?.name ?? 'Sede';
  }

  private initScheduleForm(): void {
    this.scheduleForm = this.fb.group({
      days: this.fb.array(
        DEFAULT_WEEKLY_SCHEDULE.map((day) => this.createDayFormGroup(day)),
      ),
      defaultSlotDuration: [
        30,
        [Validators.required, Validators.min(5), Validators.max(240)],
      ],
      timeZone: ['America/Bogota', Validators.required],
      isActive: [true],
    });
  }

  private patchScheduleForm(schedule: WeeklyScheduleDto): void {
    this.scheduleForm.setControl(
      'days',
      this.fb.array(schedule.days.map((day) => this.createDayFormGroup(day))),
    );

    this.scheduleForm.patchValue({
      defaultSlotDuration: schedule.defaultSlotDuration,
      timeZone: schedule.timeZone,
      isActive: schedule.isActive,
    });
  }

  private createDayFormGroup(day: DaySchedule): FormGroup {
    return this.fb.group({
      dayOfWeek: [day.dayOfWeek],
      isWorkingDay: [day.isWorkingDay],
      timeBlocks: this.fb.array(
        day.timeBlocks.length > 0
          ? day.timeBlocks.map((block) => this.createTimeBlockFormGroup(block))
          : [
              this.createTimeBlockFormGroup({
                startTime: '09:00',
                endTime: '10:00',
                professionalLocationId: null,
              }),
            ],
      ),
    });
  }

  private createTimeBlockFormGroup(block: TimeBlock): FormGroup {
    return this.fb.group({
      startTime: [block.startTime, Validators.required],
      endTime: [block.endTime, Validators.required],
      professionalLocationId: [
        block.professionalLocationId ?? null,
        Validators.required,
      ],
    });
  }

  private initAbsenceForm(): void {
    this.absenceForm = this.fb.group({
      type: ['Absent', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      overrideStartTime: [null],
      overrideEndTime: [null],
      professionalLocationId: [null],
      reason: [''],
    });

    this.absenceForm
      .get('type')
      ?.valueChanges.subscribe((type: AbsenceType) =>
        this.updateOverrideValidators(type),
      );

    this.updateOverrideValidators('Absent');
  }

  private updateOverrideValidators(type: AbsenceType): void {
    const startControl = this.absenceForm.get('overrideStartTime');
    const endControl = this.absenceForm.get('overrideEndTime');

    if (type === 'Override') {
      startControl?.setValidators([Validators.required]);
      endControl?.setValidators([Validators.required]);
    } else {
      startControl?.clearValidators();
      endControl?.clearValidators();
      startControl?.setValue(null);
      endControl?.setValue(null);
      this.absenceForm.get('professionalLocationId')?.setValue(null);
    }

    startControl?.updateValueAndValidity();
    endControl?.updateValueAndValidity();
  }

  protected getDayScheduleFormGroup(index: number): FormGroup {
    const daysArray = this.scheduleForm.get('days') as FormArray;
    return daysArray.at(index) as FormGroup;
  }

  protected getIsWorkingDayControl(index: number): FormControl {
    return this.getDayScheduleFormGroup(index).get(
      'isWorkingDay',
    ) as FormControl;
  }

  protected getTimeBlocksFormArray(dayIndex: number): FormArray {
    const dayGroup = this.getDayScheduleFormGroup(dayIndex);
    return dayGroup.get('timeBlocks') as FormArray;
  }

  protected addTimeBlock(dayIndex: number): void {
    const timeBlocks = this.getTimeBlocksFormArray(dayIndex);
    timeBlocks.push(
      this.createTimeBlockFormGroup({
        startTime: '09:00',
        endTime: '10:00',
        professionalLocationId: null,
      }),
    );
  }

  protected removeTimeBlock(dayIndex: number, blockIndex: number): void {
    const timeBlocks = this.getTimeBlocksFormArray(dayIndex);
    timeBlocks.removeAt(blockIndex);
  }

  protected getWorkingHoursSummary(dayIndex: number): string {
    const timeBlocks = this.getTimeBlocksFormArray(dayIndex).value;
    if (!timeBlocks || timeBlocks.length === 0) return '';

    return timeBlocks
      .map(
        (block: TimeBlock) =>
          `${block.startTime}-${block.endTime}${
            block.professionalLocationId
              ? ` (${this.getLocationName(block.professionalLocationId)})`
              : ''
          }`,
      )
      .join(', ');
  }

  protected saveSchedule(): void {
    if (this.scheduleForm.invalid) return;

    const value = this.scheduleForm.value;
    this.store.updateWeeklySchedule(
      value.days,
      value.defaultSlotDuration,
      value.timeZone,
      value.isActive,
    );
  }

  protected createAbsence(): void {
    if (this.absenceForm.invalid) return;

    const value = this.absenceForm.value;

    if (
      value.type === 'Override' &&
      value.overrideStartTime &&
      value.overrideEndTime &&
      value.overrideEndTime <= value.overrideStartTime
    ) {
      return;
    }

    const dto: CreateAbsenceDto = {
      type: value.type,
      startDateTime: this.toUtcRangeStart(value.startDate),
      endDateTime: this.toUtcRangeEnd(value.endDate),
      overrideStartTime:
        value.type === 'Override' ? value.overrideStartTime : null,
      overrideEndTime: value.type === 'Override' ? value.overrideEndTime : null,
      professionalLocationId:
        value.type === 'Override'
          ? (value.professionalLocationId ?? null)
          : null,
      reason: value.reason || undefined,
      institutionId: null,
    };

    this.store.createAbsence(dto);
    this.cancelAbsenceForm();
  }

  protected deleteAbsence(absenceId: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Eliminar excepción',
        message: '¿Estás seguro de eliminar esta excepción?',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn',
        icon: 'delete_forever',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.store.deleteAbsence(absenceId);
    });
  }

  protected cancelAbsenceForm(): void {
    this.showAbsenceForm.set(false);
    this.absenceForm.reset({
      type: 'Absent',
      startDate: null,
      endDate: null,
      overrideStartTime: null,
      overrideEndTime: null,
      professionalLocationId: null,
      reason: '',
    });
    this.updateOverrideValidators('Absent');
  }

  protected getAbsenceChipColor(type: AbsenceType): string {
    return type === 'Override' ? 'accent' : 'primary';
  }

  protected formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);
    return date.toLocaleString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private toUtcRangeStart(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00Z`;
  }

  private toUtcRangeEnd(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}T23:59:59Z`;
  }
}
