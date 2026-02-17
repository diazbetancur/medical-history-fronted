import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ApiError } from '@core/http/api-error';
import { ExamDto, ExamErrorCodes } from '@data/models';
import { ProfessionalPatientExamsService } from '@features/professional/services/professional-patient-exams.service';

@Component({
  selector: 'app-professional-patient-exams-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './professional-patient-exams-tab.component.html',
  styleUrl: './professional-patient-exams-tab.component.scss',
})
export class ProfessionalPatientExamsTabComponent {
  private examsService = inject(ProfessionalPatientExamsService);
  private snackBar = inject(MatSnackBar);

  // Input: Patient profile ID
  patientProfileId = input.required<number>();

  // State signals
  isLoading = signal(false);
  exams = signal<ExamDto[]>([]);
  totalItems = signal(0);
  currentPage = signal(0);
  pageSize = signal(10);
  error = signal<string | null>(null);
  noRelation = signal(false);

  // Computed: Sort exams by date (most recent first)
  sortedExams = computed(() => {
    const examsList = [...this.exams()];
    examsList.sort(
      (a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime(),
    );
    return examsList;
  });

  constructor() {
    // Load exams when patient ID changes
    effect(
      () => {
        const patientId = this.patientProfileId();
        if (patientId) {
          this.loadExams();
        }
      },
      { allowSignalWrites: true },
    );
  }

  private loadExams(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.noRelation.set(false);

    const patientId = this.patientProfileId();
    const page = this.currentPage();
    const pageSize = this.pageSize();

    this.examsService.getByPatient(patientId, page + 1, pageSize).subscribe({
      next: (response) => {
        this.exams.set(response.items);
        this.totalItems.set(response.totalCount);
        this.isLoading.set(false);
      },
      error: (err: ApiError) => {
        this.isLoading.set(false);

        // Check if no therapeutic relation
        if (
          err.status === 403 &&
          err.code === ExamErrorCodes.NO_PATIENT_RELATION
        ) {
          this.noRelation.set(true);
          this.exams.set([]);
          this.totalItems.set(0);
        } else {
          this.error.set(
            err.message || 'Error al cargar los exámenes del paciente',
          );
        }
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadExams();
  }

  retry(): void {
    this.loadExams();
  }

  viewExam(exam: ExamDto): void {
    this.examsService
      .getDownloadUrl(this.patientProfileId(), exam.id)
      .subscribe({
        next: (response) => {
          window.open(response.downloadUrl, '_blank');
        },
        error: (err: ApiError) => {
          this.snackBar.open(
            err.message || 'Error al obtener el enlace de descarga',
            'Cerrar',
            { duration: 5000 },
          );
        },
      });
  }

  downloadExam(exam: ExamDto): void {
    this.examsService
      .getDownloadUrl(this.patientProfileId(), exam.id)
      .subscribe({
        next: (response) => {
          const link = document.createElement('a');
          link.href = response.downloadUrl;
          link.download = exam.fileName;
          link.click();
        },
        error: (err: ApiError) => {
          this.snackBar.open(
            err.message || 'Error al descargar el archivo',
            'Cerrar',
            { duration: 5000 },
          );
        },
      });
  }

  getFileTypeLabel(fileType: string): string {
    return fileType === 'PDF' ? 'PDF' : 'Imagen';
  }

  getFileTypeIcon(fileType: string): string {
    return fileType === 'PDF' ? 'picture_as_pdf' : 'image';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
