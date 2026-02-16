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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { ApiError } from '@core/http/api-error';
import {
  MedicationDto,
  MedicationErrorCodes,
  MedicationStatus,
} from '@data/models';
import { ProfessionalPatientMedicationsService } from '@features/professional/services/professional-patient-medications.service';

@Component({
  selector: 'app-professional-patient-medications-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
  ],
  templateUrl: './professional-patient-medications-tab.component.html',
  styleUrl: './professional-patient-medications-tab.component.scss',
})
export class ProfessionalPatientMedicationsTabComponent {
  private medicationsService = inject(ProfessionalPatientMedicationsService);

  // Input: Patient profile ID
  patientProfileId = input.required<number>();

  // State signals
  isLoading = signal(false);
  medications = signal<MedicationDto[]>([]);
  totalItems = signal(0);
  activeCount = signal(0);
  currentPage = signal(0);
  pageSize = signal(10);
  statusFilter = signal<'All' | MedicationStatus>('All');
  error = signal<string | null>(null);
  noRelation = signal(false);

  // Computed
  activeMedications = computed(() =>
    this.medications().filter((m) => m.status === 'Active'),
  );

  constructor() {
    // Load medications when patient ID changes
    effect(
      () => {
        const patientId = this.patientProfileId();
        if (patientId) {
          this.loadMedications();
        }
      },
      { allowSignalWrites: true },
    );
  }

  private loadMedications(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.noRelation.set(false);

    const patientId = this.patientProfileId();
    const page = this.currentPage();
    const pageSize = this.pageSize();
    const status =
      this.statusFilter() === 'All' ? undefined : this.statusFilter();

    this.medicationsService
      .getByPatient(patientId, page + 1, pageSize, status as MedicationStatus)
      .subscribe({
        next: (response) => {
          this.medications.set(response.items);
          this.totalItems.set(response.totalCount);
          this.activeCount.set(response.activeCount);
          this.isLoading.set(false);
        },
        error: (err: ApiError) => {
          this.isLoading.set(false);

          // Check if no therapeutic relation
          if (
            err.status === 403 &&
            err.code === MedicationErrorCodes.NO_PATIENT_RELATION
          ) {
            this.noRelation.set(true);
            this.medications.set([]);
            this.totalItems.set(0);
            this.activeCount.set(0);
          } else {
            this.error.set(
              err.message || 'Error al cargar los medicamentos del paciente',
            );
          }
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadMedications();
  }

  onStatusFilterChange(status: 'All' | MedicationStatus): void {
    this.statusFilter.set(status);
    this.currentPage.set(0);
    this.loadMedications();
  }

  retry(): void {
    this.loadMedications();
  }
}
