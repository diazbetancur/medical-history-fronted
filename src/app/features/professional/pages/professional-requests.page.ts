import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import type { RequestStatus } from '@data/api';
import { ProfessionalRequestsStore } from '@data/stores/professional-requests.store';

@Component({
  selector: 'app-professional-requests-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
  ],
  template: `
    <div class="requests-page">
      <header class="page-header">
        <h1>Solicitudes</h1>
        <button mat-raised-button color="primary" (click)="refresh()">
          <mat-icon>refresh</mat-icon>
          Actualizar
        </button>
      </header>

      @if (store.loading()) {
        <div class="loading-container">
          <mat-spinner diameter="46"></mat-spinner>
          <p>Cargando solicitudes...</p>
        </div>
      } @else {
        <mat-tab-group
          [selectedIndex]="tabIndex()"
          (selectedIndexChange)="tabIndex.set($event)"
        >
          <mat-tab label="Pendientes ({{ store.pendingCount() }})"></mat-tab>
          <mat-tab label="Aceptadas ({{ store.acceptedCount() }})"></mat-tab>
          <mat-tab label="Completadas ({{ store.completedCount() }})"></mat-tab>
          <mat-tab label="Rechazadas ({{ store.rejectedCount() }})"></mat-tab>
        </mat-tab-group>

        @if (filtered().length === 0) {
          <mat-card class="empty-state">
            <mat-card-content>
              <mat-icon>inbox</mat-icon>
              <p>No hay solicitudes en esta categoría</p>
            </mat-card-content>
          </mat-card>
        } @else {
          <div class="requests-list">
            @for (request of filtered(); track request.id) {
              <mat-card>
                <mat-card-header>
                  <mat-card-title>{{ request.clientName }}</mat-card-title>
                  <mat-card-subtitle>{{
                    request.clientEmail
                  }}</mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                  <div class="row">
                    <strong>Servicio:</strong>
                    {{ request.serviceName || 'General' }}
                  </div>
                  @if (request.clientPhone) {
                    <div class="row">
                      <strong>Teléfono:</strong> {{ request.clientPhone }}
                    </div>
                  }
                  @if (request.message) {
                    <div class="row">
                      <strong>Mensaje:</strong> {{ request.message }}
                    </div>
                  }
                  <div class="row status-row">
                    <mat-chip [class]="chipClass(request.status)">{{
                      request.status
                    }}</mat-chip>
                  </div>
                </mat-card-content>

                <mat-card-actions>
                  @if (request.status === 'Pending') {
                    <button
                      mat-button
                      color="primary"
                      (click)="updateStatus(request.id, 'Accepted')"
                    >
                      <mat-icon>check_circle</mat-icon>
                      Aceptar
                    </button>
                    <button
                      mat-button
                      color="warn"
                      (click)="updateStatus(request.id, 'Rejected')"
                    >
                      <mat-icon>cancel</mat-icon>
                      Rechazar
                    </button>
                  }
                  @if (request.status === 'Accepted') {
                    <button
                      mat-button
                      color="primary"
                      (click)="updateStatus(request.id, 'Completed')"
                    >
                      <mat-icon>done_all</mat-icon>
                      Marcar completada
                    </button>
                  }
                </mat-card-actions>
              </mat-card>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .requests-page {
        padding: 24px;
        max-width: 1100px;
        margin: 0 auto;
      }

      .page-header {
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 48px;
      }

      .empty-state {
        margin-top: 16px;
        text-align: center;
      }

      .requests-list {
        margin-top: 16px;
        display: grid;
        gap: 12px;
      }

      .row {
        margin-bottom: 8px;
      }

      .status-row {
        margin-top: 8px;
      }

      .chip-pending {
        background: var(--color-warning-soft);
      }

      .chip-accepted {
        background: var(--color-primary-soft);
      }

      .chip-completed {
        background: var(--color-success-soft);
      }

      .chip-rejected {
        background: var(--color-danger-soft);
      }
    `,
  ],
})
export class ProfessionalRequestsPage {
  readonly store = inject(ProfessionalRequestsStore);
  readonly tabIndex = signal(0);

  readonly filtered = computed(() => {
    switch (this.tabIndex()) {
      case 0:
        return this.store.pendingRequests();
      case 1:
        return this.store.acceptedRequests();
      case 2:
        return this.store.completedRequests();
      case 3:
        return this.store.rejectedRequests();
      default:
        return this.store.requests();
    }
  });

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.store.load({}, true).subscribe();
  }

  updateStatus(
    requestId: string,
    status: Extract<RequestStatus, 'Accepted' | 'Rejected' | 'Completed'>,
  ): void {
    this.store.updateStatus(requestId, status).subscribe();
  }

  chipClass(status: RequestStatus): string {
    switch (status) {
      case 'Pending':
        return 'chip-pending';
      case 'Accepted':
        return 'chip-accepted';
      case 'Completed':
        return 'chip-completed';
      case 'Rejected':
        return 'chip-rejected';
      default:
        return '';
    }
  }
}
