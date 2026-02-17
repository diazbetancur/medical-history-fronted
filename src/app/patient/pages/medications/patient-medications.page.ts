/**
 * Patient Medications Page
 *
 * CRUD interface for patient to manage their own medications
 */

import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CreateMedicationDto,
  MedicationDto,
  MedicationStatus,
  UpdateMedicationDto,
} from '@data/models';
import { PatientMedicationsService } from '@patient/services/patient-medications.service';
import { ConfirmDialogComponent } from '@shared/ui';
import { finalize } from 'rxjs';
import { MedicationDialogComponent } from './medication-dialog.component';

@Component({
  selector: 'app-patient-medications',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './patient-medications.page.html',
  styleUrl: './patient-medications.page.scss',
})
export class PatientMedicationsPage implements OnInit {
  private readonly medicationsService = inject(PatientMedicationsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // State signals
  readonly isLoading = signal(true);
  readonly medications = signal<MedicationDto[]>([]);
  readonly totalItems = signal(0);
  readonly activeCount = signal(0);
  readonly currentPage = signal(0); // 0-based for MatPaginator
  readonly pageSize = signal(10);
  readonly statusFilter = signal<MedicationStatus | 'All'>('All');
  readonly error = signal<string | null>(null);

  // Computed
  readonly activeMedications = computed(() =>
    this.medications().filter((m) => m.status === 'Active'),
  );

  ngOnInit(): void {
    this.loadMedications();
  }

  /**
   * Load medications list
   */
  private loadMedications(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const page = this.currentPage() + 1; // Convert to 1-based for API
    const status =
      this.statusFilter() === 'All' ? undefined : this.statusFilter();

    this.medicationsService
      .getMine(page, this.pageSize(), status as MedicationStatus | undefined)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.medications.set(response.items);
          this.totalItems.set(response.totalCount);
          this.activeCount.set(response.activeCount);
        },
        error: (error) => {
          this.error.set(error.message || 'Error al cargar medicamentos');
        },
      });
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadMedications();
  }

  /**
   * Handle status filter change
   */
  onStatusFilterChange(status: MedicationStatus | 'All'): void {
    this.statusFilter.set(status);
    this.currentPage.set(0); // Reset to first page
    this.loadMedications();
  }

  /**
   * Open create medication dialog
   */
  createMedication(): void {
    const dialogRef = this.dialog.open(MedicationDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { mode: 'create' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading.set(true);
        this.medicationsService
          .create(result as CreateMedicationDto)
          .pipe(finalize(() => this.isLoading.set(false)))
          .subscribe({
            next: () => {
              this.snackBar.open('Medicamento creado exitosamente', 'OK', {
                duration: 3000,
              });
              this.medicationsService.invalidateAllCaches();
              this.loadMedications();
            },
            error: (error) => {
              this.snackBar.open(
                error.message || 'Error al crear medicamento',
                'Cerrar',
                { duration: 5000 },
              );
            },
          });
      }
    });
  }

  /**
   * Open edit medication dialog
   */
  editMedication(medication: MedicationDto): void {
    const dialogRef = this.dialog.open(MedicationDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { mode: 'edit', medication },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading.set(true);
        this.medicationsService
          .update(medication.id, result as UpdateMedicationDto)
          .pipe(finalize(() => this.isLoading.set(false)))
          .subscribe({
            next: () => {
              this.snackBar.open('Medicamento actualizado exitosamente', 'OK', {
                duration: 3000,
              });
              this.medicationsService.invalidateAllCaches();
              this.loadMedications();
            },
            error: (error) => {
              this.snackBar.open(
                error.message || 'Error al actualizar medicamento',
                'Cerrar',
                { duration: 5000 },
              );
            },
          });
      }
    });
  }

  /**
   * Delete medication with confirmation
   */
  deleteMedication(medication: MedicationDto): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Eliminar medicamento',
        message: `¿Eliminar "${medication.name}"?\n\nEsta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn',
        icon: 'delete_forever',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.medicationsService.delete(medication.id).subscribe({
        next: () => {
          this.snackBar.open('Medicamento eliminado exitosamente', 'OK', {
            duration: 3000,
          });
          this.medicationsService.invalidateAllCaches();
          this.loadMedications();
        },
        error: (error) => {
          this.snackBar.open(
            error.message || 'Error al eliminar medicamento',
            'Cerrar',
            { duration: 5000 },
          );
        },
      });
    });
  }

  /**
   * Suspend medication (quick action)
   * Sets Status=Stopped, IsOngoing=false, EndDate=today
   */
  suspendMedication(medication: MedicationDto): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Suspender medicamento',
        message: `¿Suspender el medicamento "${medication.name}"?`,
        confirmText: 'Suspender',
        cancelText: 'Cancelar',
        confirmColor: 'warn',
        icon: 'pause_circle',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      const updateDto: any = {
        name: medication.name,
        dose: medication.dose,
        frequency: medication.frequency,
        route: medication.route,
        prescribedBy: medication.prescribedBy,
        startDate: medication.startDate,
        isOngoing: false,
        endDate: new Date().toISOString().split('T')[0],
        notes: medication.notes,
        status: 'Stopped' as MedicationStatus,
      };

      this.medicationsService.update(medication.id, updateDto).subscribe({
        next: () => {
          this.snackBar.open('Medicamento suspendido exitosamente', 'OK', {
            duration: 3000,
          });
          this.medicationsService.invalidateAllCaches();
          this.loadMedications();
        },
        error: (error) => {
          this.snackBar.open(
            error.message || 'Error al suspender medicamento',
            'Cerrar',
            { duration: 5000 },
          );
        },
      });
    });
  }

  /**
   * Retry loading
   */
  retry(): void {
    this.loadMedications();
  }
}
