import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import type { AppointmentStatus } from '@data/models/appointment.models';
import { ProfessionalAppointmentsStore } from '@data/stores/professional-appointments.store';

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
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatMenuModule,
    MatBadgeModule,
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
      } @else if (!store.hasAppointments()) {
        <mat-card class="empty-state">
          <mat-card-content>
            <mat-icon class="empty-icon">event_available</mat-icon>
            <h3>No tienes citas programadas</h3>
            <p>Las citas de los próximos 7 días aparecerán aquí</p>
          </mat-card-content>
        </mat-card>
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
                        Paciente #{{ appointment.patientId.substring(0, 8) }}
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
                            Paciente #{{
                              appointment.patientId.substring(0, 8)
                            }}
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
          color: rgba(0, 0, 0, 0.6);
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
          color: rgba(0, 0, 0, 0.3);
          margin: 0 auto 16px;
        }

        h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 500;
        }

        p {
          margin: 0;
          color: rgba(0, 0, 0, 0.6);
        }
      }

      ::ng-deep .mat-mdc-tab-labels {
        .mat-mdc-tab-label {
          mat-icon {
            margin-right: 8px;
          }

          .badge {
            margin-left: 8px;
            background: #f44336;
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
          color: rgba(0, 0, 0, 0.7);

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }

          .count {
            font-size: 14px;
            color: rgba(0, 0, 0, 0.5);
            font-weight: 400;
          }
        }
      }

      .appointments-list {
        display: grid;
        gap: 16px;
      }

      .appointment-card {
        .appointment-avatar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            color: rgba(0, 0, 0, 0.7);

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
                background: #ff9800;
                color: white;
              }

              &.status-confirmed {
                background: #4caf50;
                color: white;
              }

              &.status-cancelled {
                background: #f44336;
                color: white;
              }

              &.status-completed {
                background: #2196f3;
                color: white;
              }

              &.status-no_show {
                background: #9e9e9e;
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

  protected readonly appointmentsByDate = () => this.store.appointmentsByDate();

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
}
