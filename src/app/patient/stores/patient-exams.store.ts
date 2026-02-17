import { computed, inject, Injectable, signal } from '@angular/core';
import { ToastService } from '@shared/services';
import { catchError, finalize, of, tap } from 'rxjs';
import type {
  CreateExamRequest,
  PaginatedExamsResponse,
  PatientExamDto,
  UpdateExamRequest,
  UploadAttachmentsResponse,
} from '../models/patient-exam.dto';
import { PatientExamsService } from '../services/patient-exams.service';

/**
 * Patient Exams Store
 *
 * Signal-based store para gestionar exámenes médicos del paciente
 * con cache de sesión y paginación
 */
@Injectable({
  providedIn: 'root',
})
export class PatientExamsStore {
  private readonly examsService = inject(PatientExamsService);
  private readonly toastService = inject(ToastService);

  // Cache Map: key = "page|pageSize"
  private readonly cache = new Map<string, PaginatedExamsResponse>();

  // Signals
  readonly exams = signal<PatientExamDto[]>([]);
  readonly total = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Current exam for detail view
  readonly currentExam = signal<PatientExamDto | null>(null);
  readonly loadingDetail = signal<boolean>(false);

  // Computed
  readonly totalPages = computed(() => {
    const t = this.total();
    const ps = this.pageSize();
    return Math.ceil(t / ps);
  });

  readonly isEmpty = computed(() => {
    return this.exams().length === 0 && !this.loading() && !this.error();
  });

  readonly hasExams = computed(() => {
    return this.exams().length > 0;
  });

  /**
   * Load exams with pagination
   * Uses cache if available
   */
  loadExams(page: number = 1, pageSize: number = 10): void {
    const cacheKey = `${page}|${pageSize}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      this.exams.set(cached.items);
      this.total.set(cached.total);
      this.currentPage.set(cached.page);
      this.pageSize.set(cached.pageSize);
      return;
    }

    // Fetch from API
    this.loading.set(true);
    this.error.set(null);

    this.examsService
      .list(page, pageSize)
      .pipe(
        tap((response) => {
          this.exams.set(response.items);
          this.total.set(response.total);
          this.currentPage.set(response.page);
          this.pageSize.set(response.pageSize);

          // Cache the response
          this.cache.set(cacheKey, response);
        }),
        catchError((err) => {
          this.error.set(err.error?.message || 'Error al cargar los exámenes');
          this.toastService.error('Error al cargar los exámenes');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }

  /**
   * Load exam by ID for detail view
   */
  loadExamById(id: string): void {
    this.loadingDetail.set(true);
    this.currentExam.set(null);

    this.examsService
      .getById(id)
      .pipe(
        tap((exam) => {
          this.currentExam.set(exam);
        }),
        catchError((err) => {
          this.toastService.error('Error al cargar el examen');
          return of(null);
        }),
        finalize(() => this.loadingDetail.set(false)),
      )
      .subscribe();
  }

  /**
   * Create new exam
   * Invalidates cache
   */
  createExam(request: CreateExamRequest): Promise<PatientExamDto | null> {
    return new Promise((resolve) => {
      this.examsService
        .create(request)
        .pipe(
          tap((exam) => {
            this.toastService.success('Examen creado exitosamente');
            this.clearCache();
            // Reload current page
            this.loadExams(this.currentPage(), this.pageSize());
            resolve(exam);
          }),
          catchError((err) => {
            const message = err.error?.message || 'Error al crear el examen';
            this.toastService.error(message);
            resolve(null);
            return of(null);
          }),
        )
        .subscribe();
    });
  }

  /**
   * Update exam
   * Invalidates cache
   */
  updateExam(
    id: string,
    request: UpdateExamRequest,
  ): Promise<PatientExamDto | null> {
    return new Promise((resolve) => {
      this.examsService
        .update(id, request)
        .pipe(
          tap((exam) => {
            this.toastService.success('Examen actualizado exitosamente');
            this.clearCache();
            // Update current exam if it's the one being viewed
            if (this.currentExam()?.id === id) {
              this.currentExam.set(exam);
            }
            // Reload current page
            this.loadExams(this.currentPage(), this.pageSize());
            resolve(exam);
          }),
          catchError((err) => {
            const message =
              err.error?.message || 'Error al actualizar el examen';
            this.toastService.error(message);
            resolve(null);
            return of(null);
          }),
        )
        .subscribe();
    });
  }

  /**
   * Delete exam
   * Invalidates cache
   */
  deleteExam(id: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.examsService
        .delete(id)
        .pipe(
          tap(() => {
            this.toastService.success('Examen eliminado exitosamente');
            this.clearCache();
            // Reload current page
            this.loadExams(this.currentPage(), this.pageSize());
            resolve(true);
          }),
          catchError((err) => {
            const message = err.error?.message || 'Error al eliminar el examen';
            this.toastService.error(message);
            resolve(false);
            return of(null);
          }),
        )
        .subscribe();
    });
  }

  /**
   * Upload attachments to exam
   * Invalidates cache and reloads detail
   */
  uploadAttachments(
    examId: string,
    files: File[],
  ): Promise<UploadAttachmentsResponse | null> {
    return new Promise((resolve) => {
      this.examsService
        .uploadAttachments(examId, files)
        .pipe(
          tap((response) => {
            if (response.uploaded.length > 0) {
              this.toastService.success(
                `${response.uploaded.length} archivo(s) subido(s) exitosamente`,
              );
            }
            if (response.failed.length > 0) {
              response.failed.forEach((fail) => {
                this.toastService.warning(`${fail.fileName}: ${fail.reason}`);
              });
            }
            this.clearCache();
            // Reload the exam detail to show new attachments
            this.loadExamById(examId);
            resolve(response);
          }),
          catchError((err) => {
            let message = 'Error al subir los archivos';

            if (err.status === 413) {
              message = 'Archivo supera el límite permitido';
            } else if (err.status === 415) {
              message = 'Tipo de archivo no permitido';
            } else if (err.error?.message) {
              message = err.error.message;
            }

            this.toastService.error(message);
            resolve(null);
            return of(null);
          }),
        )
        .subscribe();
    });
  }

  /**
   * Delete attachment
   * Invalidates cache and reloads detail
   */
  deleteAttachment(examId: string, attachmentId: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.examsService
        .deleteAttachment(examId, attachmentId)
        .pipe(
          tap(() => {
            this.toastService.success('Archivo eliminado exitosamente');
            this.clearCache();
            // Reload the exam detail
            this.loadExamById(examId);
            resolve(true);
          }),
          catchError((err) => {
            const message =
              err.error?.message || 'Error al eliminar el archivo';
            this.toastService.error(message);
            resolve(false);
            return of(null);
          }),
        )
        .subscribe();
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Reset store
   */
  reset(): void {
    this.exams.set([]);
    this.total.set(0);
    this.currentPage.set(1);
    this.pageSize.set(10);
    this.loading.set(false);
    this.error.set(null);
    this.currentExam.set(null);
    this.loadingDetail.set(false);
    this.clearCache();
  }
}
