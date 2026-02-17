/**
 * Professional Patient Detail Page
 *
 * Shows patient history and allows creating/editing encounters
 */

import { DatePipe } from '@angular/common';
import {
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthStore } from '@core/auth/auth.store';
import { ProfessionalEncounterListItemDto } from '@data/models';
import { ProfessionalPatientAllergiesTabComponent } from '@patient/pages/allergies/professional-patient-allergies-tab.component';
import { ProfessionalPatientBackgroundTabComponent } from '@patient/pages/background/professional-patient-background-tab.component';
import { ProfessionalPatientExamsTabComponent } from '@patient/pages/exams/professional-patient-exams-tab.component';
import { ProfessionalPatientMedicationsTabComponent } from '@patient/pages/medications/professional-patient-medications-tab.component';
import { finalize } from 'rxjs';
import { ProfessionalPatientsService } from '../../services/professional-patients.service';
import { AddAddendumDialogComponent } from './dialogs/add-addendum-dialog.component';
import { CreateEncounterDialogComponent } from './dialogs/create-encounter-dialog.component';
import { EditEncounterDialogComponent } from './dialogs/edit-encounter-dialog.component';

@Component({
  selector: 'app-professional-patient-detail',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    MatTooltipModule,
    ProfessionalPatientMedicationsTabComponent,
    ProfessionalPatientAllergiesTabComponent,
    ProfessionalPatientBackgroundTabComponent,
    ProfessionalPatientExamsTabComponent,
  ],
  templateUrl: './professional-patient-detail.page.html',
  styleUrl: './professional-patient-detail.page.scss',
})
export class ProfessionalPatientDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly patientsService = inject(ProfessionalPatientsService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authStore = inject(AuthStore);

  // Route param
  readonly patientProfileId = signal<string | null>(null);

  // State signals
  readonly isLoading = signal(true);
  readonly encounters = signal<ProfessionalEncounterListItemDto[]>([]);
  readonly totalItems = signal(0);
  readonly currentPage = signal(0); // 0-based for MatPaginator
  readonly pageSize = signal(10);
  readonly error = signal<string | null>(null);

  // Privacy filtering from service
  readonly showPrivacyDisclaimer = computed(() =>
    this.patientsService.isFilteredByPrivacy(),
  );

  constructor() {
    // Monitor route param changes
    effect(
      () => {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
          this.patientProfileId.set(id);
          this.loadHistory();
        }
      },
      { allowSignalWrites: true },
    );
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.patientProfileId.set(id);
      this.loadHistory();
    }
  }

  /**
   * Load patient history
   */
  private loadHistory(): void {
    const patientId = this.patientProfileId();
    if (!patientId) return;

    this.isLoading.set(true);
    this.error.set(null);

    const page = this.currentPage() + 1; // Convert to 1-based for API

    this.patientsService
      .getPatientHistory(patientId, page, this.pageSize())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.encounters.set(response.items);
          this.totalItems.set(response.totalCount);
        },
        error: (error) => {
          this.error.set(error.message || 'Error al cargar historia clínica');
        },
      });
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadHistory();
  }

  /**
   * Open create encounter dialog
   */
  createEncounter(): void {
    const patientId = this.patientProfileId();
    if (!patientId) return;

    const dialogRef = this.dialog.open(CreateEncounterDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { patientProfileId: patientId },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Atención creada exitosamente', 'OK', {
          duration: 3000,
        });
        this.patientsService.invalidateAllCaches();
        this.loadHistory();
      }
    });
  }

  /**
   * Open edit encounter dialog (only for drafts by current user)
   */
  editEncounter(encounter: ProfessionalEncounterListItemDto): void {
    if (!encounter.isOwnEncounter) {
      this.snackBar.open('Solo puedes editar tus propias atenciones', 'OK', {
        duration: 3000,
      });
      return;
    }

    const dialogRef = this.dialog.open(EditEncounterDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { encounterId: encounter.id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Atención actualizada exitosamente', 'OK', {
          duration: 3000,
        });
        this.patientsService.invalidateAllCaches();
        this.loadHistory();
      }
    });
  }

  /**
   * Close encounter (change status from DRAFT to CLOSED)
   */
  closeEncounter(encounter: ProfessionalEncounterListItemDto): void {
    if (!encounter.isOwnEncounter) {
      this.snackBar.open('Solo puedes cerrar tus propias atenciones', 'OK', {
        duration: 3000,
      });
      return;
    }

    if (!confirm('¿Cerrar esta atención? No podrás editarla después.')) {
      return;
    }

    this.patientsService.closeEncounter(encounter.id).subscribe({
      next: () => {
        this.snackBar.open('Atención cerrada exitosamente', 'OK', {
          duration: 3000,
        });
        this.patientsService.invalidateAllCaches();
        this.loadHistory();
      },
      error: (error) => {
        this.snackBar.open(
          error.message || 'Error al cerrar atención',
          'Cerrar',
          { duration: 5000 },
        );
      },
    });
  }

  /**
   * Open add addendum dialog (only for closed encounters)
   */
  addAddendum(encounter: ProfessionalEncounterListItemDto): void {
    if (encounter.status !== 'Closed') return;

    const dialogRef = this.dialog.open(AddAddendumDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { encounterId: encounter.id },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Addendum agregado exitosamente', 'OK', {
          duration: 3000,
        });
        this.patientsService.invalidateAllCaches();
        this.loadHistory();
      }
    });
  }

  /**
   * Check if user can edit encounter
   */
  canEdit(encounter: ProfessionalEncounterListItemDto): boolean {
    return encounter.status === 'Draft' && encounter.isOwnEncounter;
  }

  /**
   * Check if user can close encounter
   */
  canClose(encounter: ProfessionalEncounterListItemDto): boolean {
    return this.canEdit(encounter);
  }

  /**
   * Check if user can add addendum
   */
  canAddAddendum(encounter: ProfessionalEncounterListItemDto): boolean {
    return encounter.status === 'Closed';
  }

  /**
   * Go back to patients list
   */
  goBack(): void {
    this.router.navigate(['/professional/patients']);
  }

  /**
   * Retry loading
   */
  retry(): void {
    this.loadHistory();
  }
}
