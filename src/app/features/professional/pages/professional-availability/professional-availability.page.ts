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
  templateUrl: './professional-availability.page.html',
  styleUrl: './professional-availability.page.scss',
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

  protected getTimeBlocksFormArray(index: number): FormArray {
    return this.getDayScheduleFormGroup(index).get('timeBlocks') as FormArray;
  }

  protected getTimeBlockControl(
    dayIndex: number,
    blockIndex: number,
    controlName: 'startTime' | 'endTime',
  ): AbstractControl | null {
    return (
      this.getTimeBlocksFormArray(dayIndex).at(blockIndex)?.get(controlName) ??
      null
    );
  }

  protected shouldShowControlError(
    control: AbstractControl | null,
    submitted: boolean,
  ): boolean {
    return !!control && control.invalid && (control.touched || submitted);
  }

  protected addTimeBlock(index: number): void {
    this.getTimeBlocksFormArray(index).push(
      this.createTimeBlockFormGroup({
        startTime: '09:00',
        endTime: '10:00',
        professionalLocationId: null,
      }),
    );
  }

  protected removeTimeBlock(dayIndex: number, blockIndex: number): void {
    const blocks = this.getTimeBlocksFormArray(dayIndex);

    if (blocks.length === 1) {
      this.toast.warning('Debe existir al menos un bloque');
      return;
    }

    blocks.removeAt(blockIndex);
  }

  protected getWorkingHoursSummary(index: number): string {
    const timeBlocks = this.getTimeBlocksFormArray(index).value;
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
    const scheduleError = this.validateScheduleDays(
      value.days as DaySchedule[],
    );
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

  protected createAbsence(): void {
    this.absenceSubmitted.set(true);

    if (this.absenceForm.invalid) {
      this.absenceForm.markAllAsTouched();
      return;
    }

    const value = this.absenceForm.value;

    if (value.startDate && value.endDate && value.endDate < value.startDate) {
      this.toast.error(
        'La fecha de fin debe ser posterior a la fecha de inicio.',
      );
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

  protected getAbsenceChipColor(type: AbsenceType): string {
    return type === 'Override' ? 'accent' : 'primary';
  }

  protected canDeleteAbsence(startDateTime: string): boolean {
    const exceptionDate = new Date(startDateTime);
    exceptionDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return exceptionDate >= today;
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

  protected formatDateTime(value: string): string {
    const date = new Date(value);
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
          this.timeToMinutes(left.startTime) -
          this.timeToMinutes(right.startTime),
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
