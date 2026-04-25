/**
 * Patient History List Component
 *
 * Displays patient's own medical history with pagination
 */

import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PatientEncounterListItemDto } from '@data/models';
import { PatientHistoryService } from '@patient/services/patient-history.service';
import { finalize } from 'rxjs';
import { HistoryDetailDialogComponent } from './history-detail-dialog.component';

@Component({
  selector: 'app-patient-history-list',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  templateUrl: './patient-history-list.component.html',
  styleUrl: './patient-history-list.component.scss',
})
export class PatientHistoryListComponent implements OnInit {
  private readonly historyService = inject(PatientHistoryService);
  private readonly dialog = inject(MatDialog);

  // State signals
  readonly isLoading = signal(true);
  readonly encounters = signal<PatientEncounterListItemDto[]>([]);
  readonly totalItems = signal(0);
  readonly currentPage = signal(0); // 0-based for MatPaginator
  readonly pageSize = signal(10);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadHistory();
  }

  /**
   * Load history list
   */
  private loadHistory(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const page = this.currentPage() + 1; // Convert to 1-based for API

    this.historyService
      .getHistoryList(page, this.pageSize())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.encounters.set(response.items);
          this.totalItems.set(response.totalCount);
        },
        error: (error) => {
          this.error.set(error.message || 'Error al cargar historia clínica');
        },
      });
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadHistory();
  }

  /**
   * Open encounter detail dialog
   */
  openDetail(encounter: PatientEncounterListItemDto): void {
    this.dialog.open(HistoryDetailDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { encounterId: encounter.id },
    });
  }

  /**
   * Retry loading
   */
  retry(): void {
    this.loadHistory();
  }
}
