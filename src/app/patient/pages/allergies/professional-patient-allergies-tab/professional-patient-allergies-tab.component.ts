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
import { AllergyDto, AllergyErrorCodes, AllergyStatus } from '@data/models';
import { ProfessionalAllergiesService } from '@patient/services/professional-allergies.service';

@Component({
  selector: 'app-professional-patient-allergies-tab',
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
  templateUrl: './professional-patient-allergies-tab.component.html',
  styleUrl: './professional-patient-allergies-tab.component.scss',
})
export class ProfessionalPatientAllergiesTabComponent {
  private allergiesService = inject(ProfessionalAllergiesService);

  // Input: Patient profile ID
  patientProfileId = input.required<string>();

  // State signals
  isLoading = signal(false);
  allergies = signal<AllergyDto[]>([]);
  totalItems = signal(0);
  activeCount = signal(0);
  currentPage = signal(0);
  pageSize = signal(10);
  statusFilter = signal<'All' | AllergyStatus>('All');
  error = signal<string | null>(null);
  noRelation = signal(false);

  // Computed
  activeAllergies = computed(() =>
    this.allergies().filter((a) => a.status === 'Active'),
  );

  constructor() {
    // Load allergies when patient ID changes
    effect(
      () => {
        const patientId = this.patientProfileId();
        if (patientId) {
          this.loadAllergies();
        }
      },
      { allowSignalWrites: true },
    );
  }

  private loadAllergies(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.noRelation.set(false);

    const patientId = this.patientProfileId();
    const page = this.currentPage();
    const pageSize = this.pageSize();
    const status =
      this.statusFilter() === 'All' ? undefined : this.statusFilter();

    this.allergiesService
      .getByPatient(patientId, page + 1, pageSize, status as AllergyStatus)
      .subscribe({
        next: (response) => {
          this.allergies.set(response.items);
          this.totalItems.set(response.totalCount);
          this.activeCount.set(response.activeCount);
          this.isLoading.set(false);
        },
        error: (err: ApiError) => {
          this.isLoading.set(false);

          // Check if no therapeutic relation
          if (
            err.status === 403 &&
            err.code === AllergyErrorCodes.NO_PATIENT_RELATION
          ) {
            this.noRelation.set(true);
            this.allergies.set([]);
            this.totalItems.set(0);
            this.activeCount.set(0);
          } else {
            this.error.set(
              err.message || 'Error al cargar las alergias del paciente',
            );
          }
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadAllergies();
  }

  onStatusFilterChange(status: 'All' | AllergyStatus): void {
    this.statusFilter.set(status);
    this.currentPage.set(0);
    this.loadAllergies();
  }

  retry(): void {
    this.loadAllergies();
  }
}
