import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastService } from '@shared/services';
import { firstValueFrom } from 'rxjs';
import { EXAM_CATEGORY_LABELS } from '../../../models/patient-exam.dto';
import { PatientExamsService } from '../../../services/patient-exams.service';
import { PatientExamsStore } from '../../../stores/patient-exams.store';

/**
 * Confirm Delete Dialog Data
 */
interface ConfirmDeleteData {
  title: string;
  message: string;
}

/**
 * Confirm Delete Dialog Component
 */
@Component({
  selector: 'app-confirm-delete-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-raised-button color="warn" [mat-dialog-close]="true">
        Eliminar
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDeleteDialogComponent {
  readonly data = inject<ConfirmDeleteData>(MAT_DIALOG_DATA);
}

/**
 * Exam Detail Drawer Component
 *
 * Muestra detalles del examen con opción de subir/descargar/eliminar adjuntos
 */
@Component({
  selector: 'app-exam-detail-drawer',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './exam-detail-drawer.component.html',
  styleUrl: './exam-detail-drawer.component.scss',
})
export class ExamDetailDrawerComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ExamDetailDrawerComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly data = inject<{ examId: string }>(MAT_DIALOG_DATA);
  readonly store = inject(PatientExamsStore);
  private readonly examsService = inject(PatientExamsService);
  private readonly toastService = inject(ToastService);

  readonly categoryLabels = EXAM_CATEGORY_LABELS;

  ngOnInit(): void {
    // Load exam details
    this.store.loadExamById(this.data.examId);
  }

  /**
   * Close dialog
   */
  close(deleted: boolean = false): void {
    this.dialogRef.close(deleted);
  }

  /**
   * Download attachment
   */
  downloadAttachment(): void {
    this.examsService.getDownloadUrl(this.data.examId).subscribe({
      next: (url) => window.open(url, '_blank'),
      error: () =>
        this.toastService.error('No se pudo generar el enlace de descarga'),
    });
  }

  /**
   * Delete exam with confirmation
   */
  async deleteExam(): Promise<void> {
    const exam = this.store.currentExam();
    if (!exam) return;

    const confirmRef = this.dialog.open(ConfirmDeleteDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar Examen',
        message: `¿Estás seguro de eliminar "${exam.title}"? Esta acción no se puede deshacer.`,
      },
    });

    const confirmed = await firstValueFrom(confirmRef.afterClosed());
    if (confirmed) {
      const deleted = await this.store.deleteExam(this.data.examId);
      if (deleted) {
        this.close(true);
      }
    }
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
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
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
   * Get file icon based on mime type
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'picture_as_pdf';
    return 'insert_drive_file';
  }
}
