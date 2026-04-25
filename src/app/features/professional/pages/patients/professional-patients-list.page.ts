/**
 * Professional Patients List Page
 *
 * Displays paginated list of patients treated by the professional
 */

import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { PatientListItemDto } from '@data/models';
import { finalize } from 'rxjs';
import { ProfessionalPatientsService } from '../../services/professional-patients.service';

@Component({
  selector: 'app-professional-patients-list',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './professional-patients-list.page.html',
  styleUrl: './professional-patients-list.page.scss',
})
export class ProfessionalPatientsListPage implements OnInit {
  private readonly patientsService = inject(ProfessionalPatientsService);
  private readonly router = inject(Router);

  // State signals
  readonly isLoading = signal(true);
  readonly patients = signal<PatientListItemDto[]>([]);
  readonly totalItems = signal(0);
  readonly currentPage = signal(0); // 0-based for MatPaginator
  readonly pageSize = signal(10);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPatients();
  }

  /**
   * Load patients list
   */
  private loadPatients(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const page = this.currentPage() + 1; // Convert to 1-based for API

    this.patientsService
      .listMyPatients(page, this.pageSize())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.patients.set(response.items);
          this.totalItems.set(response.totalCount);
        },
        error: (error) => {
          this.error.set(error.message || 'Error al cargar pacientes');
        },
      });
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadPatients();
  }

  /**
   * Navigate to patient detail
   */
  viewPatient(patient: PatientListItemDto): void {
    this.router.navigate(['/professional/patients', patient.patientProfileId]);
  }

  /**
   * Retry loading
   */
  retry(): void {
    this.loadPatients();
  }
}
