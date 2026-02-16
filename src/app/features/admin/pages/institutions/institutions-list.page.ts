import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import type { InstitutionDto } from '@data/models/institution.models';
import { InstitutionsStore } from '@data/stores/institutions.store';
import { InstitutionFormDialogComponent } from './institution-form-dialog.component';

/**
 * Institutions List Page
 *
 * Página de listado de instituciones con filtros, tabla y acciones CRUD.
 * Ruta: /admin/institutions
 */
@Component({
  selector: 'app-institutions-list-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDialogModule,
    MatPaginatorModule,
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Instituciones</h1>
          <p class="page-subtitle">Gestión de instituciones del catálogo</p>
        </div>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          Nueva Institución
        </button>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field class="filter-field">
              <mat-label>Nombre</mat-label>
              <input
                matInput
                [(ngModel)]="filterName"
                (ngModelChange)="onFilterChange()"
                placeholder="Buscar por nombre..."
              />
              <mat-icon matPrefix>search</mat-icon>
            </mat-form-field>

            <mat-form-field class="filter-field">
              <mat-label>Código</mat-label>
              <input
                matInput
                [(ngModel)]="filterCode"
                (ngModelChange)="onFilterChange()"
                placeholder="Buscar por código..."
              />
            </mat-form-field>

            <mat-form-field class="filter-field">
              <mat-label>Estado</mat-label>
              <mat-select
                [(ngModel)]="filterIsActive"
                (ngModelChange)="onFilterChange()"
              >
                <mat-option [value]="undefined">Todos</mat-option>
                <mat-option [value]="true">Activos</mat-option>
                <mat-option [value]="false">Inactivos</mat-option>
              </mat-select>
            </mat-form-field>

            <button
              mat-stroked-button
              (click)="clearFilters()"
              class="clear-filters-btn"
            >
              <mat-icon>clear</mat-icon>
              Limpiar
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Table -->
      <mat-card class="table-card">
        <mat-card-content>
          @if (store.isLoading()) {
            <div class="loading-container">
              <mat-spinner diameter="50"></mat-spinner>
              <p>Cargando instituciones...</p>
            </div>
          } @else if (store.hasInstitutions()) {
            <table
              mat-table
              [dataSource]="store.institutions()"
              class="institutions-table"
            >
              <!-- Name Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nombre</th>
                <td mat-cell *matCellDef="let institution">
                  <strong>{{ institution.name }}</strong>
                </td>
              </ng-container>

              <!-- Code Column -->
              <ng-container matColumnDef="code">
                <th mat-header-cell *matHeaderCellDef>Código</th>
                <td mat-cell *matCellDef="let institution">
                  <code>{{ institution.code }}</code>
                </td>
              </ng-container>

              <!-- Address Column -->
              <ng-container matColumnDef="address">
                <th mat-header-cell *matHeaderCellDef>Dirección</th>
                <td mat-cell *matCellDef="let institution">
                  {{ institution.address || '-' }}
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="isActive">
                <th mat-header-cell *matHeaderCellDef>Estado</th>
                <td mat-cell *matCellDef="let institution">
                  <mat-chip
                    [class.chip-active]="institution.isActive"
                    [class.chip-inactive]="!institution.isActive"
                  >
                    {{ institution.isActive ? 'Activo' : 'Inactivo' }}
                  </mat-chip>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Acciones</th>
                <td mat-cell *matCellDef="let institution">
                  <button
                    mat-icon-button
                    (click)="openEditDialog(institution)"
                    matTooltip="Editar"
                  >
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    color="warn"
                    (click)="deleteInstitution(institution)"
                    matTooltip="Eliminar"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>

            <!-- Paginator -->
            <mat-paginator
              [length]="store.total()"
              [pageSize]="store.filters().pageSize || 10"
              [pageIndex]="(store.filters().page || 1) - 1"
              [pageSizeOptions]="[5, 10, 25, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons
            ></mat-paginator>
          } @else {
            <div class="empty-state">
              <mat-icon>business</mat-icon>
              <h3>No hay instituciones</h3>
              <p>Comienza creando tu primera institución</p>
              <button
                mat-raised-button
                color="primary"
                (click)="openCreateDialog()"
              >
                <mat-icon>add</mat-icon>
                Crear Institución
              </button>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .page-container {
        padding: 24px;
        max-width: 1400px;
        margin: 0 auto;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;

        button {
          mat-icon {
            margin-right: 8px;
          }
        }
      }

      .page-title {
        margin: 0 0 4px 0;
        font-size: 28px;
        font-weight: 500;
      }

      .page-subtitle {
        margin: 0;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
      }

      .filters-card {
        margin-bottom: 24px;
      }

      .filters-row {
        display: flex;
        gap: 16px;
        align-items: center;
        flex-wrap: wrap;
      }

      .filter-field {
        flex: 1;
        min-width: 200px;
      }

      .clear-filters-btn {
        margin-top: 8px;

        mat-icon {
          margin-right: 8px;
        }
      }

      .table-card {
        .mat-mdc-card-content {
          padding: 0;
        }
      }

      .institutions-table {
        width: 100%;

        th {
          font-weight: 600;
          color: rgba(0, 0, 0, 0.87);
        }

        td {
          code {
            background: rgba(0, 0, 0, 0.05);
            padding: 4px 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
          }
        }
      }

      .chip-active {
        background-color: #4caf50 !important;
        color: white !important;
      }

      .chip-inactive {
        background-color: #9e9e9e !important;
        color: white !important;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px;
        gap: 16px;

        p {
          margin: 0;
          color: rgba(0, 0, 0, 0.6);
        }
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 64px 24px;
        text-align: center;

        mat-icon {
          font-size: 64px;
          width: 64px;
          height: 64px;
          color: rgba(0, 0, 0, 0.26);
          margin-bottom: 16px;
        }

        h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 500;
        }

        p {
          margin: 0 0 24px 0;
          color: rgba(0, 0, 0, 0.6);
        }

        button mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
          margin-right: 8px;
        }
      }

      mat-paginator {
        border-top: 1px solid rgba(0, 0, 0, 0.12);
      }

      @media (max-width: 768px) {
        .page-container {
          padding: 16px;
        }

        .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
        }

        .filters-row {
          flex-direction: column;
          align-items: stretch;

          .filter-field {
            width: 100%;
          }
        }
      }
    `,
  ],
})
export class InstitutionsListPage {
  readonly store = inject(InstitutionsStore);
  private readonly dialog = inject(MatDialog);

  // Filter state
  filterName = '';
  filterCode = '';
  filterIsActive: boolean | undefined = undefined;

  displayedColumns: string[] = [
    'name',
    'code',
    'address',
    'isActive',
    'actions',
  ];

  /**
   * Handle filter changes with debounce
   */
  private filterTimeout: any;
  onFilterChange(): void {
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      this.store.setFilters({
        name: this.filterName || undefined,
        code: this.filterCode || undefined,
        isActive: this.filterIsActive,
      });
    }, 300);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterName = '';
    this.filterCode = '';
    this.filterIsActive = undefined;
    this.store.clearFilters();
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.store.setFilters({
      page: event.pageIndex + 1,
      pageSize: event.pageSize,
    });
  }

  /**
   * Open create institution dialog
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(InstitutionFormDialogComponent, {
      width: '600px',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.createInstitution(result);
      }
    });
  }

  /**
   * Open edit institution dialog
   */
  openEditDialog(institution: InstitutionDto): void {
    const dialogRef = this.dialog.open(InstitutionFormDialogComponent, {
      width: '600px',
      data: { mode: 'edit', institution },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.store.updateInstitution(institution.id, result);
      }
    });
  }

  /**
   * Delete institution with confirmation
   */
  deleteInstitution(institution: InstitutionDto): void {
    const confirmed = confirm(
      `¿Estás seguro de que deseas eliminar la institución "${institution.name}"?`,
    );

    if (confirmed) {
      this.store.deleteInstitution(institution.id, institution.name);
    }
  }
}
