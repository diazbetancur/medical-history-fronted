/**
 * Privacy Settings Component
 *
 * Allows patient to manage their medical history sharing preferences
 */

import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PatientHistoryService } from '@patient/services/patient-history.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-privacy-settings',
  standalone: true,
  imports: [
    MatCardModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './privacy-settings.component.html',
  styleUrl: './privacy-settings.component.scss',
})
export class PrivacySettingsComponent implements OnInit {
  private readonly historyService = inject(PatientHistoryService);
  private readonly snackBar = inject(MatSnackBar);

  // State signals
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly shareFullHistory = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPrivacySettings();
  }

  /**
   * Load current privacy settings
   */
  private loadPrivacySettings(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.historyService
      .getPrivacySettings()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (data) => {
          this.shareFullHistory.set(
            data.shareFullHistoryWithTreatingProfessionals,
          );
        },
        error: (error) => {
          this.error.set(error.message || 'Error al cargar configuración');
        },
      });
  }

  /**
   * Handle toggle change
   */
  onToggleChange(checked: boolean): void {
    this.isSaving.set(true);
    this.error.set(null);

    this.historyService
      .updatePrivacySettings({
        shareFullHistoryWithTreatingProfessionals: checked,
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.shareFullHistory.set(checked);
          this.snackBar.open('Configuración actualizada', 'OK', {
            duration: 3000,
          });
        },
        error: (error) => {
          // Revert toggle on error
          this.shareFullHistory.set(!checked);
          this.error.set(error.message || 'Error al actualizar configuración');
          this.snackBar.open('Error al actualizar configuración', 'Cerrar', {
            duration: 5000,
          });
        },
      });
  }

  /**
   * Retry loading settings
   */
  retry(): void {
    this.loadPrivacySettings();
  }
}
