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
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ isPdf ? 'picture_as_pdf' : 'image' }}</mat-icon>
      {{ data.exam.title }}
    </h2>

    <mat-dialog-content>
      @if (loading()) {
        <div class="state loading">
          <mat-spinner diameter="36" />
          <p>Cargando vista previa...</p>
        </div>
      } @else if (error()) {
        <div class="state error">
          <mat-icon>error_outline</mat-icon>
          <p>{{ error() }}</p>
        </div>
      } @else if (previewUrl()) {
        <div class="preview-container">
          @if (isPdf) {
            <iframe
              [src]="safePreviewUrl()"
              title="Vista previa de examen"
              class="pdf-frame"
            ></iframe>
          } @else {
            <img
              [src]="previewUrl()!"
              [alt]="'Vista previa de ' + data.exam.title"
              class="image-preview"
            />
          }
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cerrar</button>
      <button
        mat-raised-button
        color="primary"
        (click)="openInNewTab()"
        [disabled]="!previewUrl()"
      >
        <mat-icon>open_in_new</mat-icon>
        Abrir en nueva pestaña
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      h2[mat-dialog-title] {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      mat-dialog-content {
        min-width: min(80vw, 920px);
        min-height: 420px;
      }

      .state {
        height: 420px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 12px;
      }

      .state.error {
        color: var(--mat-app-error);
      }

      .preview-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        min-height: 420px;
      }

      .pdf-frame {
        width: 100%;
        height: 72vh;
        border: 1px solid var(--mat-app-outline-variant);
        border-radius: 8px;
      }

      .image-preview {
        max-width: 100%;
        max-height: 72vh;
        border-radius: 8px;
        object-fit: contain;
        border: 1px solid var(--mat-app-outline-variant);
      }
    `,
  ],
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
            .pipe(switchMap((signed) => of(signed.downloadUrl)));
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
