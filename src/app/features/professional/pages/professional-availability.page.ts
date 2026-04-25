import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal } from '@angular/core';
import {
  AbstractControl,
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
import { AuthStore } from '@core/auth';
import {
  ABSENCE_TYPE_NAMES,
  type AbsenceType,
  type CreateAbsenceDto,
} from '@data/models/professional-absence.models';
import {
  DAYS_OF_WEEK,
  DAY_NAMES,
  type DayOfWeek,
  type DaySchedule,
  type TimeBlock,
  type WeeklyScheduleDto,
} from '@data/models/professional-schedule.models';
import { ProfessionalAvailabilityStore } from '@data/stores/professional-availability.store';
import { ToastService } from '@shared/services/toast.service';
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
                  <mat-expansion-panel>
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
                                <mat-label>Hora de inicio *</mat-label>
                                <input
                                  matInput
                                  type="time"
                                  formControlName="startTime"
                                />
                                @if (
                                  shouldShowControlError(
                                    getTimeBlockControl(i, j, 'startTime'),
                                    scheduleSubmitted()
                                  )
                                ) {
                                  <mat-error>Selecciona la hora de inicio</mat-error>
                                }
                              </mat-form-field>

                              <mat-icon class="arrow">arrow_forward</mat-icon>

                              <mat-form-field appearance="outline">
                                <mat-label>Hora de fin *</mat-label>
                                <input
                                  matInput
                                  type="time"
                                  formControlName="endTime"
                                />
                                @if (
                                  shouldShowControlError(
                                    getTimeBlockControl(i, j, 'endTime'),
                                    scheduleSubmitted()
                                  )
                                ) {
                                  <mat-error>Selecciona la hora de fin</mat-error>
                                }
                              </mat-form-field>

                              @if (store.locations().length > 0) {
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
                              }

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
                  <mat-label>Duracion de cada slot *</mat-label>
                  <mat-select formControlName="defaultSlotDuration">
                    @for (minutes of slotMinuteOptions; track minutes) {
                      <mat-option [value]="minutes">
                        {{ minutes }} minutos
                      </mat-option>
                    }
                  </mat-select>
                  @if (
                    shouldShowControlError(
                      scheduleForm.get('defaultSlotDuration'),
                      scheduleSubmitted()
                    )
                  ) {
                    <mat-error>Selecciona una duracion valida</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Zona horaria *</mat-label>
                  <mat-select formControlName="timeZone">
                    @for (timeZone of timeZoneOptions; track timeZone) {
                      <mat-option [value]="timeZone">{{ timeZone }}</mat-option>
                    }
                  </mat-select>
                  @if (
                    shouldShowControlError(
                      scheduleForm.get('timeZone'),
                      scheduleSubmitted()
                    )
                  ) {
                    <mat-error>Selecciona una zona horaria</mat-error>
                  }
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
              [disabled]="store.isSaving()"
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
                      <mat-label>Tipo *</mat-label>
                      <mat-select formControlName="type">
                        @for (type of absenceTypes; track type) {
                          <mat-option [value]="type">{{
                            absenceTypeNames[type]
                          }}</mat-option>
                        }
                      </mat-select>
                      @if (
                        shouldShowControlError(
                          absenceForm.get('type'),
                          absenceSubmitted()
                        )
                      ) {
                        <mat-error>Selecciona un tipo de excepcion</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Fecha de inicio *</mat-label>
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
                      @if (
                        shouldShowControlError(
                          absenceForm.get('startDate'),
                          absenceSubmitted()
                        )
                      ) {
                        <mat-error>Selecciona la fecha de inicio</mat-error>
                      }
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Fecha de fin *</mat-label>
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
                      @if (
                        shouldShowControlError(
                          absenceForm.get('endDate'),
                          absenceSubmitted()
                        )
                      ) {
                        <mat-error>Selecciona la fecha de fin</mat-error>
                      }
                    </mat-form-field>
                  </div>

                  @if (isOverrideType()) {
                    <div class="form-row">
                      <mat-form-field appearance="outline">
                        <mat-label>Hora de inicio especial *</mat-label>
                        <input
                          matInput
                          type="time"
                          formControlName="overrideStartTime"
                        />
                        @if (
                          shouldShowControlError(
                            absenceForm.get('overrideStartTime'),
                            absenceSubmitted()
                          )
                        ) {
                          <mat-error>Selecciona la hora de inicio</mat-error>
                        }
                      </mat-form-field>

                      <mat-form-field appearance="outline">
                        <mat-label>Hora de fin especial *</mat-label>
                        <input
                          matInput
                          type="time"
                          formControlName="overrideEndTime"
                        />
                        @if (
                          shouldShowControlError(
                            absenceForm.get('overrideEndTime'),
                            absenceSubmitted()
                          )
                        ) {
                          <mat-error>Selecciona la hora de fin</mat-error>
                        }
                      </mat-form-field>

                      @if (store.locations().length > 0) {
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
                      }
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
                      [disabled]="store.isSaving()"
                      type="button"
                    >
                      <mat-icon>save</mat-icon>
                      Guardar
                    </button>
                    <button mat-button (click)="cancelAbsenceForm()" type="button">
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
                          [disabled]="!canDeleteAbsence(absence.startDateTime)"
                          (click)="
                            deleteAbsence(absence.id, absence.startDateTime)
                          "
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
  private static readonly HONDURAS_TIMEZONE = 'America/Tegucigalpa';

  protected readonly store = inject(ProfessionalAvailabilityStore);
  private readonly authStore = inject(AuthStore);
  protected readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  protected readonly daysOfWeek = DAYS_OF_WEEK;
  protected readonly dayNames = DAY_NAMES;
  protected readonly absenceTypes: AbsenceType[] = ['Absent', 'Override'];
  protected readonly absenceTypeNames = ABSENCE_TYPE_NAMES;
  protected readonly slotMinuteOptions = [
    5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240,
  ];
  protected readonly timeZoneOptions = [
    'America/Tegucigalpa',
    'America/Bogota',
    'America/Guatemala',
    'America/Mexico_City',
    'America/Lima',
    'UTC',
  ];

  protected readonly showAbsenceForm = signal(false);
  protected readonly scheduleSubmitted = signal(false);
  protected readonly absenceSubmitted = signal(false);

  protected scheduleForm!: FormGroup;
  protected absenceForm!: FormGroup;

  private readonly loadScheduleEffect = effect(() => {
    const user = this.authStore.user();
    const currentContext = this.authStore.currentContext();
    const professionalId =
      user?.professionalProfileId ??
      (currentContext?.type === 'PROFESSIONAL' ? currentContext.id : null);

    if (!professionalId) {
      return;
    }

    if (this.store.weeklySchedule() || this.store.isLoadingSchedule()) {
      return;
    }

    this.store.loadWeeklySchedule(professionalId);
    this.store.loadFutureAbsences(professionalId);
    this.store.loadLocations();
  });

  private readonly patchScheduleEffect = effect(() => {
    const schedule = this.store.weeklySchedule();

    if (!schedule || !this.scheduleForm) {
      return;
    }

    queueMicrotask(() => {
      if (!this.scheduleForm) {
        return;
      }

      this.patchScheduleForm(schedule);
    });
  });

  ngOnInit(): void {
    this.initScheduleForm();
    this.initAbsenceForm();
    this.store.initialize();
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
        this.daysOfWeek.map((day) =>
          this.createDayFormGroup(this.createEmptyDaySchedule(day)),
        ),
      ),
      defaultSlotDuration: [
        30,
        [Validators.required, Validators.min(5), Validators.max(240)],
      ],
      timeZone: [
        ProfessionalAvailabilityPage.HONDURAS_TIMEZONE,
        Validators.required,
      ],
      isActive: [true],
    });
  }

  private createEmptyDaySchedule(dayOfWeek: DayOfWeek): DaySchedule {
    return {
      dayOfWeek,
      isWorkingDay: false,
      timeBlocks: [],
    };
  }

  private patchScheduleForm(schedule: WeeklyScheduleDto): void {
    this.scheduleForm.setControl(
      'days',
      this.fb.array(schedule.days.map((day) => this.createDayFormGroup(day))),
    );

    this.scheduleForm.patchValue({
      defaultSlotDuration: schedule.defaultSlotDuration,
      timeZone:
        schedule.timeZone || ProfessionalAvailabilityPage.HONDURAS_TIMEZONE,
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
      professionalLocationId: [block.professionalLocationId ?? null],
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

  protected getTimeBlockControl(
    dayIndex: number,
    blockIndex: number,
    controlName: 'startTime' | 'endTime' | 'professionalLocationId',
  ): AbstractControl | null {
    return this.getTimeBlocksFormArray(dayIndex).at(blockIndex)?.get(controlName) ?? null;
  }

  protected shouldShowControlError(
    control: AbstractControl | null,
    submitted: boolean,
  ): boolean {
    return !!control && control.invalid && (submitted || control.touched || control.dirty);
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
    this.scheduleSubmitted.set(true);

    if (this.scheduleForm.invalid) {
      this.scheduleForm.markAllAsTouched();
      return;
    }

    const value = this.scheduleForm.getRawValue();
    const scheduleError = this.validateScheduleDays(value.days as DaySchedule[]);
    if (scheduleError) {
      this.toast.error(scheduleError);
      return;
    }

    this.store.updateWeeklySchedule(
      value.days,
      value.defaultSlotDuration,
      value.timeZone,
      value.isActive,
    );
  }

  protected createAbsence(): void {
    this.absenceSubmitted.set(true);

    if (this.absenceForm.invalid) {
      this.absenceForm.markAllAsTouched();
      return;
    }

    const value = this.absenceForm.value;

    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      this.toast.error('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    if (
      value.type === 'Override' &&
      value.overrideStartTime &&
      value.overrideEndTime &&
      value.overrideEndTime <= value.overrideStartTime
    ) {
      this.toast.error(
        'La hora fin del override debe ser mayor a la hora inicio.',
      );
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
      reason: value.reason?.trim() || undefined,
      slotDurationMinutes:
        Number(this.scheduleForm.get('defaultSlotDuration')?.value) || 30,
      institutionId: null,
    };

    this.store.createAbsence(dto);
    this.cancelAbsenceForm();
  }

  protected deleteAbsence(absenceId: string, startDateTime: string): void {
    if (!this.canDeleteAbsence(startDateTime)) {
      this.toast.info(
        'Solo puedes eliminar excepciones del día actual o futuras.',
      );
      return;
    }

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

  protected canDeleteAbsence(startDateTime: string): boolean {
    const exceptionDate = new Date(startDateTime);
    exceptionDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return exceptionDate >= today;
  }

  protected cancelAbsenceForm(): void {
    this.showAbsenceForm.set(false);
    this.absenceSubmitted.set(false);
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

  private validateScheduleDays(days: DaySchedule[]): string | null {
    let hasAnyWorkingWindow = false;

    for (const day of days) {
      if (!day.isWorkingDay) {
        continue;
      }

      const rawBlocks = day.timeBlocks ?? [];
      if (rawBlocks.length === 0) {
        return `Agrega al menos un bloque horario para ${this.dayNames[day.dayOfWeek]}.`;
      }

      hasAnyWorkingWindow = true;

      const timeBlocks = [...rawBlocks].sort(
        (left, right) =>
          this.timeToMinutes(left.startTime) - this.timeToMinutes(right.startTime),
      );

      for (let index = 0; index < timeBlocks.length; index += 1) {
        const block = timeBlocks[index];
        const start = this.timeToMinutes(block.startTime);
        const end = this.timeToMinutes(block.endTime);

        if (end <= start) {
          return `En ${this.dayNames[day.dayOfWeek]}, cada bloque debe terminar después de iniciar.`;
        }

        const previousBlock = timeBlocks[index - 1];
        if (!previousBlock) {
          continue;
        }

        const previousEnd = this.timeToMinutes(previousBlock.endTime);
        if (start < previousEnd) {
          return `En ${this.dayNames[day.dayOfWeek]} hay bloques horarios superpuestos.`;
        }
      }
    }

    if (!hasAnyWorkingWindow) {
      return 'Agrega al menos un bloque horario a la plantilla semanal.';
    }

    return null;
  }

  private timeToMinutes(value: string): number {
    const [hours = '0', minutes = '0'] = (value || '').split(':');
    return Number(hours) * 60 + Number(minutes);
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
