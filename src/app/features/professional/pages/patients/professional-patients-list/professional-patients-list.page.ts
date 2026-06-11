/**
 * Professional Patients List Page
 *
 * Displays paginated list of patients treated by the professional
 */

import { DatePipe } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { PatientListItemDto } from '@data/models';
import { debounceTime, distinctUntilChanged, finalize, Subject } from 'rxjs';
import { ProfessionalPatientsService } from '../../../services/professional-patients.service';
import {
  ExternalPatientDialogComponent,
  type ExternalPatientDialogResult,
} from '../external-patient-dialog/external-patient-dialog.component';

@Component({
  selector: 'app-professional-patients-list',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './professional-patients-list.page.html',
  styleUrl: './professional-patients-list.page.scss',
})
export class ProfessionalPatientsListPage implements OnInit {
  private readonly patientsService = inject(ProfessionalPatientsService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchChanges = new Subject<string>();

  // State signals
  readonly isLoading = signal(true);
  readonly patients = signal<PatientListItemDto[]>([]);
  readonly totalItems = signal(0);
  readonly currentPage = signal(0); // 0-based for MatPaginator
  readonly pageSize = signal(10);
  readonly searchValue = signal('');
  readonly error = signal<string | null>(null);
  readonly requestingAccessFor = signal<string | null>(null);
  readonly displayedColumns = [
    'patient',
    'documentType',
    'documentNumber',
    'patientType',
    'profileVisible',
    'lastAppointment',
    'fullHistory',
    'actions',
  ];

  ngOnInit(): void {
    this.searchChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPage.set(0);
        this.loadPatients();
      });

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
      .listMyPatients(page, this.pageSize(), this.searchValue())
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

  onSearchChange(value: string): void {
    this.searchValue.set(value);
    this.searchChanges.next(value.trim());
  }

  clearSearch(): void {
    if (!this.searchValue()) {
      return;
    }

    this.searchValue.set('');
    this.searchChanges.next('');
  }

  openExternalPatientDialog(): void {
    const ref = this.dialog.open<
      ExternalPatientDialogComponent,
      void,
      ExternalPatientDialogResult | null
    >(ExternalPatientDialogComponent, {
      width: '760px',
      maxWidth: '95vw',
      disableClose: true,
    });

    ref.afterClosed().subscribe((result) => {
      if (!result?.patientProfileId) {
        return;
      }

      this.snackBar.open(
        result.created ? 'Paciente externo creado' : 'Paciente encontrado',
        'OK',
        { duration: 2500 },
      );
      this.loadPatients();
      this.openManualEncounter(result.patientProfileId);
    });
  }

  openManualEncounter(patientProfileId?: string | null): void {
    if (!patientProfileId) {
      return;
    }

    this.router.navigate(['/professional/patients', patientProfileId], {
      queryParams: { createEncounter: 1 },
    });
  }

  /**
   * Navigate to patient detail
   */
  viewPatient(patient: PatientListItemDto): void {
    this.router.navigate(['/professional/patients', patient.patientProfileId]);
  }

  trackByPatientId(_: number, patient: PatientListItemDto): string {
    return patient.patientProfileId;
  }

  getPatientTypeLabel(patient: PatientListItemDto): string {
    if (patient.patientType) {
      return patient.patientType;
    }

    return patient.isRegisteredPatient ? 'Registrado' : 'Externo';
  }

  canViewFullHistory(patient: PatientListItemDto): boolean {
    return patient.canViewFullHistory ?? patient.shareFullHistoryFlag;
  }

  canViewProfileDetails(patient: PatientListItemDto): boolean {
    return patient.canViewProfileDetails ?? true;
  }

  getPatientDocument(patient: PatientListItemDto): string {
    if (patient.documentType && patient.documentNumber) {
      return `${patient.documentType} ${patient.documentNumber}`;
    }

    return patient.documentNumber || 'DNI no disponible';
  }

  hasActiveSearch(): boolean {
    return this.searchValue().trim().length > 0;
  }

  requestFullHistoryAccess(patient: PatientListItemDto, event: Event): void {
    event.stopPropagation();

    if (!patient.canRequestFullHistoryAccess) {
      return;
    }

    this.requestingAccessFor.set(patient.patientProfileId);
    this.patientsService
      .requestFullHistoryAccess(patient.patientProfileId)
      .pipe(finalize(() => this.requestingAccessFor.set(null)))
      .subscribe({
        next: () => {
          this.snackBar.open(
            'Solicitud enviada al paciente para aprobar acceso',
            'OK',
            { duration: 3500 },
          );
        },
        error: (error) => {
          this.snackBar.open(
            error.message || 'No se pudo enviar la solicitud',
            'Cerrar',
            { duration: 5000 },
          );
        },
      });
  }

  /**
   * Retry loading
   */
  retry(): void {
    this.loadPatients();
  }

}
