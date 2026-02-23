import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthStore } from '@core/auth/auth.store';
import { ProfessionalAppointmentsApi } from '@data/api/professional-appointments.api';
import type {
  AppointmentDto,
  AppointmentStatus,
} from '@data/models/appointment.models';
import { ProfessionalAppointmentsStore } from '@data/stores/professional-appointments.store';
import { ToastService } from '@shared/services';

/**
 * Professional Appointments Page
 *
 * Lista citas del profesional (hoy + próximos 7 días).
 */
@Component({
  selector: 'app-professional-appointments-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatMenuModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="appointments-page">
      <header class="page-header">
        <div class="header-content">
          <h1>Mis Citas</h1>
          <button
            mat-raised-button
            color="primary"
            (click)="store.loadUpcomingAppointments()"
          >
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
        </div>
      </header>

      @if (store.isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Cargando citas...</p>
        </div>
      } @else {
        <!-- Tabs: Hoy / Próximas -->
        <mat-tab-group>
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>today</mat-icon>
              <span>Hoy</span>
              @if (store.todayAppointments().length > 0) {
                <span class="badge">{{
                  store.todayAppointments().length
                }}</span>
              }
            </ng-template>

            @if (store.todayAppointments().length === 0) {
              <div class="empty-tab">
                <mat-icon>check_circle</mat-icon>
                <p>No tienes citas para hoy</p>
              </div>
            } @else {
              <div class="appointments-list">
                @for (
                  appointment of store.todayAppointments();
                  track appointment.id
                ) {
                  <mat-card class="appointment-card">
                    <mat-card-header>
                      <div mat-card-avatar class="appointment-avatar">
                        <mat-icon>person</mat-icon>
                      </div>
                      <mat-card-title>
                        {{ getPatientDisplayName(appointment) }}
                      </mat-card-title>
                      <mat-card-subtitle>
                        <mat-icon>schedule</mat-icon>
                        {{ appointment.startTime }} - {{ appointment.endTime }}
                      </mat-card-subtitle>
                    </mat-card-header>

                    <mat-card-content>
                      <div class="appointment-info">
                        <div class="info-row">
                          <mat-icon>event</mat-icon>
                          <span>{{ formatDate(appointment.date) }}</span>
                        </div>

                        @if (appointment.notes) {
                          <div class="info-row notes">
                            <mat-icon>note</mat-icon>
                            <span>{{ appointment.notes }}</span>
                          </div>
                        }

                        <div class="status-chip">
                          <mat-chip
                            [class]="
                              'status-' + appointment.status.toLowerCase()
                            "
                          >
                            {{ getStatusLabel(appointment.status) }}
                          </mat-chip>
                        </div>
                      </div>
                    </mat-card-content>

                    <mat-card-actions>
                      <button mat-button [matMenuTriggerFor]="menu">
                        <mat-icon>more_vert</mat-icon>
                        Acciones
                      </button>
                      <mat-menu #menu="matMenu">
                        @if (appointment.status === 'PENDING') {
                          <button
                            mat-menu-item
                            (click)="confirmAppointment(appointment.id)"
                          >
                            <mat-icon>check_circle</mat-icon>
                            <span>Confirmar</span>
                          </button>
                        }
                        @if (appointment.status === 'CONFIRMED') {
                          <button
                            mat-menu-item
                            (click)="completeAppointment(appointment.id)"
                          >
                            <mat-icon>done_all</mat-icon>
                            <span>Marcar como completada</span>
                          </button>
                          <button
                            mat-menu-item
                            (click)="markAsNoShow(appointment.id)"
                          >
                            <mat-icon>event_busy</mat-icon>
                            <span>Paciente no asistió</span>
                          </button>
                        }
                        @if (
                          appointment.status !== 'CANCELLED' &&
                          appointment.status !== 'COMPLETED'
                        ) {
                          <button
                            mat-menu-item
                            (click)="cancelAppointment(appointment.id)"
                          >
                            <mat-icon>cancel</mat-icon>
                            <span>Cancelar cita</span>
                          </button>
                        }
                      </mat-menu>
                    </mat-card-actions>
                  </mat-card>
                }
              </div>
            }
          </mat-tab>

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>event</mat-icon>
              <span>Próximos 7 días</span>
              @if (store.upcomingAppointments().length > 0) {
                <span class="badge">{{
                  store.upcomingAppointments().length
                }}</span>
              }
            </ng-template>

            @if (store.upcomingAppointments().length === 0) {
              <div class="empty-tab">
                <mat-icon>event</mat-icon>
                <p>No tienes citas programadas</p>
              </div>
            } @else {
              <!-- Agrupar por fecha -->
              @for (
                dateGroup of appointmentsByDate() | keyvalue;
                track dateGroup.key
              ) {
                <div class="date-group">
                  <h3 class="date-header">
                    <mat-icon>calendar_today</mat-icon>
                    {{ formatDate(dateGroup.key) }}
                    <span class="count"
                      >({{ dateGroup.value.length }} citas)</span
                    >
                  </h3>

                  <div class="appointments-list">
                    @for (
                      appointment of dateGroup.value;
                      track appointment.id
                    ) {
                      <mat-card class="appointment-card">
                        <mat-card-header>
                          <div mat-card-avatar class="appointment-avatar">
                            <mat-icon>person</mat-icon>
                          </div>
                          <mat-card-title>
                            {{ getPatientDisplayName(appointment) }}
                          </mat-card-title>
                          <mat-card-subtitle>
                            <mat-icon>schedule</mat-icon>
                            {{ appointment.startTime }} -
                            {{ appointment.endTime }}
                          </mat-card-subtitle>
                        </mat-card-header>

                        <mat-card-content>
                          <div class="appointment-info">
                            @if (appointment.notes) {
                              <div class="info-row notes">
                                <mat-icon>note</mat-icon>
                                <span>{{ appointment.notes }}</span>
                              </div>
                            }

                            <div class="status-chip">
                              <mat-chip
                                [class]="
                                  'status-' + appointment.status.toLowerCase()
                                "
                              >
                                {{ getStatusLabel(appointment.status) }}
                              </mat-chip>
                            </div>
                          </div>
                        </mat-card-content>

                        <mat-card-actions>
                          <button mat-button [matMenuTriggerFor]="menu2">
                            <mat-icon>more_vert</mat-icon>
                            Acciones
                          </button>
                          <mat-menu #menu2="matMenu">
                            @if (appointment.status === 'PENDING') {
                              <button
                                mat-menu-item
                                (click)="confirmAppointment(appointment.id)"
                              >
                                <mat-icon>check_circle</mat-icon>
                                <span>Confirmar</span>
                              </button>
                            }
                            @if (
                              appointment.status !== 'CANCELLED' &&
                              appointment.status !== 'COMPLETED'
                            ) {
                              <button
                                mat-menu-item
                                (click)="cancelAppointment(appointment.id)"
                              >
                                <mat-icon>cancel</mat-icon>
                                <span>Cancelar cita</span>
                              </button>
                            }
                          </mat-menu>
                        </mat-card-actions>
                      </mat-card>
                    }
                  </div>
                </div>
              }
            }
          </mat-tab>

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>date_range</mat-icon>
              <span>Por rango</span>
              @if (rangeAppointments().length > 0) {
                <span class="badge">{{ rangeAppointments().length }}</span>
              }
            </ng-template>

            <div class="range-filter">
              <mat-form-field appearance="outline">
                <mat-label>Desde</mat-label>
                <input
                  matInput
                  type="date"
                  [ngModel]="rangeFrom()"
                  (ngModelChange)="rangeFrom.set($event)"
                />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Hasta</mat-label>
                <input
                  matInput
                  type="date"
                  [ngModel]="rangeTo()"
                  (ngModelChange)="rangeTo.set($event)"
                />
              </mat-form-field>

              <button
                mat-raised-button
                color="primary"
                (click)="applyDateRangeFilter()"
                [disabled]="rangeLoading()"
              >
                <mat-icon>search</mat-icon>
                Buscar
              </button>
            </div>

            @if (rangeLoading()) {
              <div class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Cargando citas del rango...</p>
              </div>
            } @else if (hasRangeFilterResult() && rangeAppointments().length === 0) {
              <div class="empty-tab">
                <mat-icon>event_busy</mat-icon>
                <p>No hay citas para ese rango de fechas</p>
              </div>
            } @else if (rangeAppointments().length > 0) {
              @for (
                dateGroup of groupedRangeEntries();
                track dateGroup.date
              ) {
                <div class="date-group">
                  <h3 class="date-header">
                    <mat-icon>calendar_today</mat-icon>
                    {{ formatDate(dateGroup.date) }}
                    <span class="count"
                      >({{ dateGroup.appointments.length }} citas)</span
                    >
                  </h3>

                  <div class="appointments-list">
                    @for (
                      appointment of dateGroup.appointments;
                      track appointment.id
                    ) {
                      <mat-card class="appointment-card">
                        <mat-card-header>
                          <div mat-card-avatar class="appointment-avatar">
                            <mat-icon>person</mat-icon>
                          </div>
                          <mat-card-title>
                            {{ getPatientDisplayName(appointment) }}
                          </mat-card-title>
                          <mat-card-subtitle>
                            <mat-icon>schedule</mat-icon>
                            {{ appointment.startTime }} -
                            {{ appointment.endTime }}
                          </mat-card-subtitle>
                        </mat-card-header>

                        <mat-card-content>
                          <div class="appointment-info">
                            @if (appointment.notes) {
                              <div class="info-row notes">
                                <mat-icon>note</mat-icon>
                                <span>{{ appointment.notes }}</span>
                              </div>
                            }

                            <div class="status-chip">
                              <mat-chip
                                [class]="
                                  'status-' + appointment.status.toLowerCase()
                                "
                              >
                                {{ getStatusLabel(appointment.status) }}
                              </mat-chip>
                            </div>
                          </div>
                        </mat-card-content>
                      </mat-card>
                    }
                  </div>
                </div>
              }
            }
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [
    `
      .appointments-page {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: 24px;

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;

          h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 500;
          }

          button mat-icon {
            margin-right: 8px;
          }
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

      .empty-state,
      .empty-tab {
        text-align: center;
        padding: 64px 24px;

        .empty-icon,
        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: var(--color-text-disabled);
          margin: 0 auto 16px;
        }

        h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 500;
        }

        p {
          margin: 0;
          color: var(--color-text-secondary);
        }
      }

      ::ng-deep .mat-mdc-tab-labels {
        .mat-mdc-tab-label {
          mat-icon {
            margin-right: 8px;
          }

          .badge {
            margin-left: 8px;
            background: var(--color-error);
            color: white;
            border-radius: 10px;
            padding: 2px 8px;
            font-size: 12px;
            font-weight: 500;
          }
        }
      }

      .date-group {
        margin-bottom: 32px;

        .date-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 500;
          color: var(--color-text-primary);

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }

          .count {
            font-size: 14px;
            color: var(--color-text-tertiary);
            font-weight: 400;
          }
        }
      }

      .range-filter {
        display: grid;
        grid-template-columns: repeat(2, minmax(180px, 240px)) auto;
        gap: 12px;
        align-items: center;
        margin: 16px 0 20px;

        button mat-icon {
          margin-right: 6px;
        }
      }

      .appointments-list {
        display: grid;
        gap: 16px;
      }

      .appointment-card {
        .appointment-avatar {
          background: var(--gradient-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
          }
        }

        mat-card-subtitle {
          display: flex;
          align-items: center;
          gap: 4px;

          mat-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }

        .appointment-info {
          .info-row {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            margin-bottom: 8px;
            color: var(--color-text-primary);

            mat-icon {
              font-size: 18px;
              width: 18px;
              height: 18px;
              flex-shrink: 0;
            }

            &.notes {
              font-style: italic;
            }
          }

          .status-chip {
            margin-top: 12px;

            mat-chip {
              &.status-pending {
                background: var(--color-warning);
                color: white;
              }

              &.status-confirmed {
                background: var(--color-success);
                color: white;
              }

              &.status-cancelled {
                background: var(--color-error);
                color: white;
              }

              &.status-completed {
                background: var(--color-primary);
                color: white;
              }

              &.status-no_show {
                background: var(--color-text-disabled);
                color: white;
              }
            }
          }
        }
      }

      @media (max-width: 768px) {
        .appointments-page {
          padding: 16px;
        }

        .range-filter {
          grid-template-columns: 1fr;
        }

        .page-header .header-content {
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;

          button {
            width: 100%;
          }
        }
      }
    `,
  ],
})
export class ProfessionalAppointmentsPage implements OnInit {
  protected readonly store = inject(ProfessionalAppointmentsStore);
  private readonly appointmentsApi = inject(ProfessionalAppointmentsApi);
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastService);

  protected readonly rangeFrom = signal(this.getDateInputValue(new Date()));
  protected readonly rangeTo = signal(
    this.getDateInputValue(this.addDays(new Date(), 7)),
  );
  protected readonly rangeLoading = signal(false);
  protected readonly hasRangeFilterResult = signal(false);
  protected readonly rangeAppointments = signal<AppointmentDto[]>([]);

  protected readonly appointmentsByDate = () => this.store.appointmentsByDate();
  protected readonly groupedRangeAppointments = computed(() => {
    const grouped: Record<string, AppointmentDto[]> = {};

    for (const appointment of this.rangeAppointments()) {
      if (!grouped[appointment.date]) {
        grouped[appointment.date] = [];
      }

      grouped[appointment.date].push(appointment);
    }

    return Object.keys(grouped)
      .sort()
      .reduce((acc, date) => {
        acc[date] = grouped[date].sort((a, b) =>
          a.startTime.localeCompare(b.startTime),
        );
        return acc;
      }, {} as Record<string, AppointmentDto[]>);
  });
  protected readonly groupedRangeEntries = computed(() =>
    Object.entries(this.groupedRangeAppointments()).map(
      ([date, appointments]) => ({ date, appointments }),
    ),
  );

  ngOnInit(): void {
    this.store.loadUpcomingAppointments();
  }

  protected formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(+year, +month - 1, +day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  protected getStatusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      PENDING: 'Pendiente',
      CONFIRMED: 'Confirmada',
      CANCELLED: 'Cancelada',
      COMPLETED: 'Completada',
      NO_SHOW: 'No asistió',
    };
    return labels[status];
  }

  protected confirmAppointment(appointmentId: string): void {
    this.store.confirmAppointment(appointmentId);
  }

  protected cancelAppointment(appointmentId: string): void {
    // TODO: Abrir dialog para motivo de cancelación
    this.store.cancelAppointment(appointmentId);
  }

  protected completeAppointment(appointmentId: string): void {
    this.store.completeAppointment(appointmentId);
  }

  protected markAsNoShow(appointmentId: string): void {
    this.store.markAsNoShow(appointmentId);
  }

  protected applyDateRangeFilter(): void {
    const from = this.rangeFrom();
    const to = this.rangeTo();

    if (!from || !to) {
      this.toast.warning('Debes seleccionar fecha inicial y final');
      return;
    }

    if (from > to) {
      this.toast.warning('La fecha inicial no puede ser mayor que la final');
      return;
    }

    const professionalId = this.authStore.user()?.professionalProfileId;
    if (!professionalId) {
      this.toast.error('No se encontró perfil profesional');
      return;
    }

    this.rangeLoading.set(true);
    this.hasRangeFilterResult.set(true);
    this.rangeAppointments.set([]);

    this.appointmentsApi
      .getAppointments({
        professionalId,
        from,
        to,
        page: 1,
        pageSize: 100,
      })
      .subscribe({
        next: (response) => {
          this.rangeAppointments.set(response.items ?? []);
          this.rangeLoading.set(false);
        },
        error: (error: { error?: { title?: string } }) => {
          this.toast.error(
            error?.error?.title || 'Error al cargar citas por rango',
          );
          this.rangeLoading.set(false);
        },
      });
  }

  protected getPatientDisplayName(appointment: AppointmentDto): string {
    if (appointment.patientName?.trim()) {
      return appointment.patientName;
    }

    if (appointment.patientId?.trim()) {
      return `Paciente #${appointment.patientId.substring(0, 8)}`;
    }

    return 'Paciente';
  }

  private getDateInputValue(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private addDays(date: Date, days: number): Date {
    const value = new Date(date);
    value.setDate(value.getDate() + days);
    return value;
  }
}
