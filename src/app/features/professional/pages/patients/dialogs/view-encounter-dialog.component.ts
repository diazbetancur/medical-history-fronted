import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MedicalEncounterDto } from '@data/models';
import { finalize } from 'rxjs';
import { ProfessionalPatientsService } from '../../../services/professional-patients.service';

export interface ViewEncounterDialogData {
  encounterId: string;
}

@Component({
  selector: 'app-view-encounter-dialog',
  standalone: true,
  imports: [
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './view-encounter-dialog.component.html',
  styleUrl: './view-encounter-dialog.component.scss',
})
export class ViewEncounterDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ViewEncounterDialogComponent>);
  private readonly data = inject<ViewEncounterDialogData>(MAT_DIALOG_DATA);
  private readonly patientsService = inject(ProfessionalPatientsService);

  readonly isLoading = signal(true);
  readonly encounter = signal<MedicalEncounterDto | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadDetail();
  }

  private loadDetail(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.patientsService
      .getEncounterDetail(this.data.encounterId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (encounter) => this.encounter.set(encounter),
        error: (error) => {
          this.error.set(error.message || 'Error al cargar el detalle de la atención');
        },
      });
  }

  retry(): void {
    this.loadDetail();
  }

  close(): void {
    this.dialogRef.close();
  }
}
