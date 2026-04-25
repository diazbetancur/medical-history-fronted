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
import { ConfirmDialogComponent } from '@shared/ui';
import { InstitutionFormDialogComponent } from '../institution-form-dialog/institution-form-dialog.component';

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
  templateUrl: './institutions-list.page.html',
  styleUrl: './institutions-list.page.scss',
})
export class InstitutionsListPage {
  readonly store = inject(InstitutionsStore);
  private readonly dialog = inject(MatDialog);

  filterName = '';
  filterCode = '';
  filterIsActive: boolean | undefined = undefined;

  displayedColumns: string[] = ['name', 'code', 'isActive', 'actions'];

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

  clearFilters(): void {
    this.filterName = '';
    this.filterCode = '';
    this.filterIsActive = undefined;
    this.store.clearFilters();
  }

  onPageChange(event: PageEvent): void {
    this.store.setFilters({
      page: event.pageIndex + 1,
      pageSize: event.pageSize,
    });
  }

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

  deleteInstitution(institution: InstitutionDto): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '460px',
      data: {
        title: 'Eliminar institución',
        message: `¿Estás seguro de que deseas eliminar la institución "${institution.name}"?`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn',
        icon: 'delete_forever',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.store.deleteInstitution(institution.id, institution.name);
    });
  }
}
