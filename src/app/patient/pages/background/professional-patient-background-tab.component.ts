import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ApiError } from '@core/http/api-error';
import { BackgroundDto, BackgroundErrorCodes } from '@data/models';
import { ProfessionalBackgroundService } from '@patient/services/professional-background.service';

@Component({
  selector: 'app-professional-patient-background-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './professional-patient-background-tab.component.html',
  styleUrl: './professional-patient-background-tab.component.scss',
})
export class ProfessionalPatientBackgroundTabComponent {
  private backgroundService = inject(ProfessionalBackgroundService);

  // Input: Patient profile ID
  patientProfileId = input.required<string>();

  // State signals
  isLoading = signal(false);
  backgrounds = signal<BackgroundDto[]>([]);
  totalItems = signal(0);
  error = signal<string | null>(null);
  noRelation = signal(false);

  // Computed: Chronic backgrounds first, then sorted by eventDate
  sortedBackgrounds = computed(() => {
    const items = [...this.backgrounds()];
    return items.sort((a, b) => {
      // Chronic first
      if (a.isChronic && !b.isChronic) return -1;
      if (!a.isChronic && b.isChronic) return 1;

      // Then by eventDate (most recent first)
      if (a.eventDate && b.eventDate) {
        return (
          new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
        );
      }
      if (a.eventDate && !b.eventDate) return -1;
      if (!a.eventDate && b.eventDate) return 1;

      // Finally by title
      return a.title.localeCompare(b.title);
    });
  });

  // Computed: Count of chronic backgrounds
  chronicCount = computed(
    () => this.backgrounds().filter((b) => b.isChronic).length,
  );

  constructor() {
    // Load backgrounds when patient ID changes
    effect(
      () => {
        const patientId = this.patientProfileId();
        if (patientId) {
          this.loadBackgrounds();
        }
      },
      { allowSignalWrites: true },
    );
  }

  private loadBackgrounds(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.noRelation.set(false);

    const patientId = this.patientProfileId();

    this.backgroundService.getByPatient(patientId).subscribe({
      next: (response) => {
        this.backgrounds.set(response.items);
        this.totalItems.set(response.totalCount);
        this.isLoading.set(false);
      },
      error: (err: ApiError) => {
        this.isLoading.set(false);

        // Check if no therapeutic relation
        if (
          err.status === 403 &&
          err.code === BackgroundErrorCodes.NO_PATIENT_RELATION
        ) {
          this.noRelation.set(true);
          this.backgrounds.set([]);
          this.totalItems.set(0);
        } else {
          this.error.set(
            err.message || 'Error al cargar los antecedentes del paciente',
          );
        }
      },
    });
  }

  retry(): void {
    this.loadBackgrounds();
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      Surgery: 'Cirugía',
      ChronicDisease: 'Enfermedad Crónica',
      Trauma: 'Trauma',
      FamilyHistory: 'Antecedente Familiar',
      Hospitalization: 'Hospitalización',
      Other: 'Otro',
    };
    return labels[type] || type;
  }
}
