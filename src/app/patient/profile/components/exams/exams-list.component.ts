import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { EXAM_CATEGORY_LABELS } from '../../../models/patient-exam.dto';
import { PatientExamsStore } from '../../../stores/patient-exams.store';
import { ExamCreateDialogComponent } from './exam-create-dialog.component';
import { ExamDetailDrawerComponent } from './exam-detail-drawer.component';

/**
 * Exams List Component
 *
 * Lista paginada de exámenes médicos del paciente
 */
@Component({
  selector: 'app-exams-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './exams-list.component.html',
  styleUrl: './exams-list.component.scss',
})
export class ExamsListComponent implements OnInit {
  readonly store = inject(PatientExamsStore);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly categoryLabels = EXAM_CATEGORY_LABELS;

  ngOnInit(): void {
    // Load exams on init
    this.store.loadExams(1, 10);
  }

  /**
   * Open create exam dialog
   */
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ExamCreateDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((created) => {
      if (created) {
        this.store.loadExams(1, 10);
      }
    });
  }

  /**
   * Open exam detail drawer/dialog
   */
  openExamDetail(examId: string): void {
    const dialogRef = this.dialog.open(ExamDetailDrawerComponent, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { examId },
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((deleted) => {
      if (deleted) {
        this.store.loadExams(this.store.currentPage(), this.store.pageSize());
      }
    });
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.store.loadExams(event.pageIndex + 1, event.pageSize);
  }

  /**
   * Format date for display
   */
  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Navigate to complete profile if needed
   */
  goToWizard(): void {
    this.router.navigate(['/patient/wizard']);
  }
}
