import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  AllergyDto,
  AllergyStatus,
  CreateAllergyDto,
  UpdateAllergyDto,
} from '@data/models';
import { PatientAllergiesService } from '@patient/services/patient-allergies.service';
import {
  AllergyDialogComponent,
  AllergyDialogData,
} from './allergy-dialog.component';

@Component({
  selector: 'app-patient-allergies',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './patient-allergies.page.html',
  styleUrl: './patient-allergies.page.scss',
})
export class PatientAllergiesPage implements OnInit {
  private readonly allergiesService = inject(PatientAllergiesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // State signals
  isLoading = signal(false);
  allergies = signal<AllergyDto[]>([]);
  totalItems = signal(0);
  activeCount = signal(0);
  currentPage = signal(0); // 0-based for MatPaginator
  pageSize = signal(10);
  statusFilter = signal<'All' | AllergyStatus>('All');
  error = signal<string | null>(null);

  // Computed
  activeAllergies = computed(() =>
    this.allergies().filter((a) => a.status === 'Active'),
  );

  ngOnInit(): void {
    this.loadAllergies();
  }

  private loadAllergies(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const page = this.currentPage() + 1; // Backend is 1-based
    const pageSize = this.pageSize();
    const status =
      this.statusFilter() === 'All' ? undefined : this.statusFilter();

    this.allergiesService
      .getMine(page, pageSize, status as AllergyStatus)
      .subscribe({
        next: (response) => {
          this.allergies.set(response.items);
          this.totalItems.set(response.totalCount);
          this.activeCount.set(response.activeCount);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.error.set(err.message || 'Error al cargar las alergias');
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadAllergies();
  }

  onStatusFilterChange(status: 'All' | AllergyStatus): void {
    this.statusFilter.set(status);
    this.currentPage.set(0);
    this.loadAllergies();
  }

  createAllergy(): void {
    const dialogRef = this.dialog.open<
      AllergyDialogComponent,
      AllergyDialogData,
      CreateAllergyDto | null
    >(AllergyDialogComponent, {
      width: '600px',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((dto) => {
      if (dto) {
        this.isLoading.set(true);
        this.allergiesService.create(dto).subscribe({
          next: () => {
            this.snackBar.open('Alergia agregada exitosamente', 'Cerrar', {
              duration: 3000,
            });
            this.loadAllergies();
          },
          error: (err) => {
            this.isLoading.set(false);
            this.snackBar.open(
              err.message || 'Error al crear la alergia',
              'Cerrar',
              { duration: 5000 },
            );
          },
        });
      }
    });
  }

  editAllergy(allergy: AllergyDto): void {
    const dialogRef = this.dialog.open<
      AllergyDialogComponent,
      AllergyDialogData,
      UpdateAllergyDto | null
    >(AllergyDialogComponent, {
      width: '600px',
      data: { mode: 'edit', allergy },
    });

    dialogRef.afterClosed().subscribe((dto) => {
      if (dto) {
        this.isLoading.set(true);
        this.allergiesService.update(allergy.id, dto).subscribe({
          next: () => {
            this.snackBar.open('Alergia actualizada exitosamente', 'Cerrar', {
              duration: 3000,
            });
            this.loadAllergies();
          },
          error: (err) => {
            this.isLoading.set(false);
            this.snackBar.open(
              err.message || 'Error al actualizar la alergia',
              'Cerrar',
              { duration: 5000 },
            );
          },
        });
      }
    });
  }

  deleteAllergy(allergy: AllergyDto): void {
    const confirmed = confirm(
      `¿Estás seguro de eliminar la alergia "${allergy.allergen}"?`,
    );

    if (confirmed) {
      this.isLoading.set(true);
      this.allergiesService.delete(allergy.id).subscribe({
        next: () => {
          this.snackBar.open('Alergia eliminada exitosamente', 'Cerrar', {
            duration: 3000,
          });
          this.loadAllergies();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.snackBar.open(
            err.message || 'Error al eliminar la alergia',
            'Cerrar',
            { duration: 5000 },
          );
        },
      });
    }
  }

  retry(): void {
    this.loadAllergies();
  }
}
