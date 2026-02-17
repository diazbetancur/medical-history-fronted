/**
 * History Detail Dialog Component
 *
 * Displays detailed view of a single medical encounter
 */

import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MedicalEncounterDto } from '@data/models';
import { PatientHistoryService } from '@patient/services/patient-history.service';
import { finalize } from 'rxjs';

export interface HistoryDetailDialogData {
  encounterId: string;
}

@Component({
  selector: 'app-history-detail-dialog',
  standalone: true,
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './history-detail-dialog.component.html',
  styleUrl: './history-detail-dialog.component.scss',
})
export class HistoryDetailDialogComponent implements OnInit {
  private readonly dialogRef = inject(
    MatDialogRef<HistoryDetailDialogComponent>,
  );
  private readonly data = inject<HistoryDetailDialogData>(MAT_DIALOG_DATA);
  private readonly historyService = inject(PatientHistoryService);

  // State signals
  readonly isLoading = signal(true);
  readonly encounter = signal<MedicalEncounterDto | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadEncounterDetail();
  }

  /**
   * Load encounter detail
   */
  private loadEncounterDetail(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.historyService
      .getHistoryDetail(this.data.encounterId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (encounter) => {
          this.encounter.set(encounter);
        },
        error: (error) => {
          this.error.set(error.message || 'Error al cargar detalle');
        },
      });
  }

  /**
   * Close dialog
   */
  close(): void {
    this.dialogRef.close();
  }

  /**
   * Retry loading
   */
  retry(): void {
    this.loadEncounterDetail();
  }
}
