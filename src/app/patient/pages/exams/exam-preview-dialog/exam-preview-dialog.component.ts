import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ExamDto } from '@data/models';
import { PatientExamsMvpService } from '@patient/services/patient-exams-mvp.service';
import { catchError, of, switchMap } from 'rxjs';

interface ExamPreviewDialogData {
  exam: ExamDto;
}

@Component({
  selector: 'app-exam-preview-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './exam-preview-dialog.component.html',
  styleUrl: './exam-preview-dialog.component.scss',
})
export class ExamPreviewDialogComponent {
  readonly data = inject<ExamPreviewDialogData>(MAT_DIALOG_DATA);
  private readonly examsService = inject(PatientExamsMvpService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly previewUrl = signal<string | null>(null);

  readonly isPdf = this.data.exam.fileType === 'PDF';

  constructor() {
    this.loadPreviewUrl();
  }

  safePreviewUrl(): SafeResourceUrl | null {
    const url = this.previewUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  }

  openInNewTab(): void {
    const url = this.previewUrl();
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private loadPreviewUrl(): void {
    this.loading.set(true);
    this.error.set(null);

    this.examsService
      .getById(this.data.exam.id)
      .pipe(
        switchMap((detail) => {
          if (detail.downloadUrl) {
            return of(detail.downloadUrl);
          }
          return this.examsService
            .getDownloadUrl(this.data.exam.id)
            .pipe(
              switchMap((signed) =>
                of(signed.downloadUrl ?? signed.url ?? null),
              ),
            );
        }),
        catchError(() => {
          this.error.set('No se pudo obtener la vista previa del examen');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((url) => {
        this.previewUrl.set(url);
        this.loading.set(false);
      });
  }
}
