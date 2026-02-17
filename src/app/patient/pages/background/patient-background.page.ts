import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  BackgroundDto,
  CreateBackgroundDto,
  UpdateBackgroundDto,
} from '@data/models';
import { PatientBackgroundService } from '@patient/services/patient-background.service';
import {
  BackgroundDialogComponent,
  BackgroundDialogData,
} from './background-dialog.component';

@Component({
  selector: 'app-patient-background',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './patient-background.page.html',
  styleUrl: './patient-background.page.scss',
})
export class PatientBackgroundPage implements OnInit {
  private readonly backgroundService = inject(PatientBackgroundService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // State signals
  isLoading = signal(false);
  backgrounds = signal<BackgroundDto[]>([]);
  totalItems = signal(0);
  error = signal<string | null>(null);

  // Computed: Chronic backgrounds first, then sorted by eventDate
  sortedBackgrounds = computed(() => {
    const items = [...this.backgrounds()];
    return items.sort((a, b) => {
      // Chronic first
      if (a.isChronic && !b.isChronic) return -1;
      if (!a.isChronic && b.isChronic) return 1;

      // Then by eventDate (most recent first)
      if (a.eventDate && b.eventDate) {
        return (
          new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
        );
      }
      if (a.eventDate && !b.eventDate) return -1;
      if (!a.eventDate && b.eventDate) return 1;

      // Finally by title
      return a.title.localeCompare(b.title);
    });
  });

  // Computed: Count of chronic backgrounds
  chronicCount = computed(
    () => this.backgrounds().filter((b) => b.isChronic).length,
  );

  ngOnInit(): void {
    this.loadBackgrounds();
  }

  private loadBackgrounds(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.backgroundService.getMine().subscribe({
      next: (response) => {
        this.backgrounds.set(response.items);
        this.totalItems.set(response.totalCount);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.error.set(err.message || 'Error al cargar los antecedentes');
      },
    });
  }

  createBackground(): void {
    const dialogRef = this.dialog.open(BackgroundDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { mode: 'create' } as BackgroundDialogData,
    });

    dialogRef.afterClosed().subscribe((result: CreateBackgroundDto | null) => {
      if (result) {
        this.isLoading.set(true);
        this.backgroundService.create(result).subscribe({
          next: () => {
            this.snackBar.open('Antecedente agregado exitosamente', 'OK', {
              duration: 3000,
            });
            this.loadBackgrounds();
          },
          error: (err) => {
            this.isLoading.set(false);
            this.snackBar.open(
              err.message || 'Error al crear antecedente',
              'Cerrar',
              { duration: 5000 },
            );
          },
        });
      }
    });
  }

  editBackground(background: BackgroundDto): void {
    const dialogRef = this.dialog.open(BackgroundDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { mode: 'edit', background } as BackgroundDialogData,
    });

    dialogRef.afterClosed().subscribe((result: UpdateBackgroundDto | null) => {
      if (result) {
        this.isLoading.set(true);
        this.backgroundService.update(background.id, result).subscribe({
          next: () => {
            this.snackBar.open('Antecedente actualizado exitosamente', 'OK', {
              duration: 3000,
            });
            this.loadBackgrounds();
          },
          error: (err) => {
            this.isLoading.set(false);
            this.snackBar.open(
              err.message || 'Error al actualizar antecedente',
              'Cerrar',
              { duration: 5000 },
            );
          },
        });
      }
    });
  }

  deleteBackground(background: BackgroundDto): void {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar el antecedente "${background.title}"?`,
      )
    ) {
      return;
    }

    this.isLoading.set(true);
    this.backgroundService.delete(background.id).subscribe({
      next: () => {
        this.snackBar.open('Antecedente eliminado exitosamente', 'OK', {
          duration: 3000,
        });
        this.loadBackgrounds();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.snackBar.open(
          err.message || 'Error al eliminar antecedente',
          'Cerrar',
          { duration: 5000 },
        );
      },
    });
  }

  retry(): void {
    this.loadBackgrounds();
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      Surgery: 'Cirugía',
      ChronicDisease: 'Enfermedad Crónica',
      Trauma: 'Trauma',
      FamilyHistory: 'Antecedente Familiar',
      Hospitalization: 'Hospitalización',
      Other: 'Otro',
    };
    return labels[type] || type;
  }
}
