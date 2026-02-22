/**
 * Patient Exams Page
 *
 * CRUD interface for patient to manage their own exams with file upload
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExamDto } from '@data/models';
import { PatientExamsMvpService } from '@patient/services/patient-exams-mvp.service';
import { ConfirmDialogComponent } from '@shared/ui';
import { finalize } from 'rxjs';
import { ExamEditDialogComponent } from './exam-edit-dialog.component';
import { ExamPreviewDialogComponent } from './exam-preview-dialog.component';
import { ExamUploadDialogComponent } from './exam-upload-dialog.component';

@Component({
  selector: 'app-patient-exams',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './patient-exams.page.html',
  styleUrl: './patient-exams.page.scss',
})
export class PatientExamsPage implements OnInit {
  private readonly examsService = inject(PatientExamsMvpService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  // State signals
  readonly isLoading = signal(true);
  readonly exams = signal<ExamDto[]>([]);
  readonly totalItems = signal(0);
  readonly currentPage = signal(0); // 0-based for MatPaginator
  readonly pageSize = signal(10);
  readonly error = signal<string | null>(null);

  // Computed
  readonly sortedExams = computed(() => {
    return [...this.exams()].sort((a, b) => {
      // Sort by examDate descending (most recent first)
      return new Date(b.examDate).getTime() - new Date(a.examDate).getTime();
    });
  });

  ngOnInit(): void {
    this.loadExams();
  }

  /**
   * Load exams list
   */
  private loadExams(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const page = this.currentPage() + 1; // Convert to 1-based for API

    this.examsService
      .getMine(page, this.pageSize())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.exams.set(response.items);
          this.totalItems.set(response.totalCount);
        },
        error: (error) => {
          this.error.set(error.message || 'Error al cargar exámenes');
        },
      });
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadExams();
  }

  /**
   * Open upload exam dialog
   */
  uploadExam(): void {
    const dialogRef = this.dialog.open(ExamUploadDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Examen subido exitosamente', 'OK', {
          duration: 3000,
        });
        this.examsService.invalidateAllCaches();
        this.loadExams();
      }
    });
  }

  /**
   * Open edit exam dialog
   */
  editExam(exam: ExamDto): void {
    const dialogRef = this.dialog.open(ExamEditDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { exam },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Examen actualizado exitosamente', 'OK', {
          duration: 3000,
        });
        this.examsService.invalidateAllCaches();
        this.loadExams();
      }
    });
  }

  /**
   * View exam file in new tab
   */
  viewExam(exam: ExamDto): void {
    this.dialog.open(ExamPreviewDialogComponent, {
      width: 'min(92vw, 980px)',
      maxWidth: '98vw',
      data: { exam },
    });
  }

  /**
   * Download exam file
   */
  downloadExam(exam: ExamDto): void {
    this.examsService.getDownloadUrl(exam.id).subscribe({
      next: (response) => {
        const link = document.createElement('a');
        link.href = response.downloadUrl;
        link.download = exam.fileName;
        link.click();
      },
      error: (error) => {
        this.snackBar.open(
          error.message || 'Error al descargar examen',
          'Cerrar',
          { duration: 5000 },
        );
      },
    });
  }

  /**
   * Delete exam with confirmation
   */
  deleteExam(exam: ExamDto): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Eliminar examen',
        message: `¿Eliminar "${exam.title}"?\n\nEsta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn',
        icon: 'delete_forever',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.examsService.delete(exam.id).subscribe({
        next: () => {
          this.snackBar.open('Examen eliminado exitosamente', 'OK', {
            duration: 3000,
          });
          this.examsService.invalidateAllCaches();
          this.loadExams();
        },
        error: (error) => {
          this.snackBar.open(
            error.message || 'Error al eliminar examen',
            'Cerrar',
            { duration: 5000 },
          );
        },
      });
    });
  }

  /**
   * Get file type label
   */
  getFileTypeLabel(exam: ExamDto): string {
    return exam.fileType === 'PDF' ? 'PDF' : 'Imagen';
  }

  /**
   * Get file type icon
   */
  getFileTypeIcon(exam: ExamDto): string {
    return exam.fileType === 'PDF' ? 'picture_as_pdf' : 'image';
  }

  /**
   * Show inline thumbnail only for images with available URL.
   * Falls back to icon for PDFs or when URL is not present in list response.
   */
  showImageThumb(exam: ExamDto): boolean {
    return exam.fileType === 'IMAGE' && !!exam.downloadUrl;
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Retry loading
   */
  retry(): void {
    this.loadExams();
  }
}
