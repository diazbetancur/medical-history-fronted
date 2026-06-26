import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '@shared/services';
import { ConfirmDialogComponent } from '@shared/ui';
import { ActingPatientStore } from '../../services/acting-patient.store';
import { FamilyGroupService } from '../../services/family-group.service';
import {
  AllergyInput,
  BackgroundInput,
  MedicationInput,
} from '../../services/family-group.models';
import { ExamPreviewDialogComponent } from '../exams/exam-preview-dialog/exam-preview-dialog.component';
import { AllergyFormDialogComponent } from './dialogs/allergy-form-dialog.component';
import { BackgroundFormDialogComponent } from './dialogs/background-form-dialog.component';
import {
  ExamUploadDialogComponent,
  ExamUploadDialogResult,
} from './dialogs/exam-upload-dialog.component';
import { MedicationFormDialogComponent } from './dialogs/medication-form-dialog.component';

@Component({
  selector: 'app-managed-patient',
  standalone: true,
  imports: [
    DatePipe,
    MatTabsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './managed-patient.page.html',
  styleUrl: './managed-patient.page.scss',
})
export class ManagedPatientPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly familyGroup = inject(FamilyGroupService);
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(MatDialog);
  protected readonly acting = inject(ActingPatientStore);

  protected readonly history = signal<any[]>([]);
  protected readonly exams = signal<any[]>([]);
  protected readonly medications = signal<any[]>([]);
  protected readonly allergies = signal<any[]>([]);
  protected readonly background = signal<any[]>([]);
  protected readonly appointments = signal<any[]>([]);

  protected readonly loading = signal(true);

  private id = '';

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('patientProfileId') ?? '';

    let pending = 6;
    const done = (): void => {
      if (--pending <= 0) this.loading.set(false);
    };

    this.loadArea('history', this.history, done);
    this.loadArea('exams', this.exams, done);
    this.loadArea('medications', this.medications, done);
    this.loadArea('allergies', this.allergies, done);
    this.loadArea('background', this.background, done);
    this.loadArea('appointments', this.appointments, done);
  }

  private loadArea(
    area: string,
    target: ReturnType<typeof signal<any[]>>,
    done?: () => void,
  ): void {
    this.familyGroup
      .getPatientArea<Record<string, unknown>>(this.id, area)
      .subscribe({
        next: (res) => {
          target.set(
            (res?.['items'] as any[]) ??
              (Array.isArray(res) ? (res as any[]) : []),
          );
          done?.();
        },
        error: () => {
          this.toast.error(`No se pudo cargar ${area}`);
          done?.();
        },
      });
  }

  // --- Exámenes ---

  uploadExam(): void {
    this.dialog
      .open(ExamUploadDialogComponent, { width: '520px' })
      .afterClosed()
      .subscribe((data: ExamUploadDialogResult | null | undefined) => {
        if (!data) return;
        this.familyGroup.uploadExam(this.id, data).subscribe({
          next: () => {
            this.toast.success('Examen subido');
            this.loadArea('exams', this.exams);
          },
          error: (e) => this.toast.error(e?.message || 'No se pudo subir el examen'),
        });
      });
  }

  viewExam(item: any): void {
    const examId: string = item.id;
    const fileType = item.fileContentType === 'application/pdf' ? 'PDF' : 'IMAGE';
    this.familyGroup.getExamViewUrl(this.id, examId).subscribe({
      next: (response) => {
        const url = response.downloadUrl ?? (response as any).url ?? null;
        if (!url) {
          this.toast.error('No se pudo obtener la vista previa del examen');
          return;
        }
        this.dialog.open(ExamPreviewDialogComponent, {
          width: 'min(92vw, 980px)',
          maxWidth: '98vw',
          data: {
            exam: {
              id: examId,
              patientProfileId: this.id,
              title: item.title ?? '',
              examDate: item.examDate ?? '',
              originalFileName: item.originalFileName ?? item.title ?? '',
              fileType,
              fileSizeBytes: item.fileSizeBytes ?? 0,
              uploadedAtUtc: item.uploadedAtUtc ?? item.dateCreated ?? '',
              updatedAtUtc: item.updatedAtUtc ?? item.dateCreated ?? '',
              isActive: item.isActive ?? true,
            },
            preloadedUrl: url,
          },
        });
      },
      error: (e) => this.toast.error(e?.message || 'No se pudo obtener la vista previa del examen'),
    });
  }

  downloadExam(item: any): void {
    const examId: string = item.id;
    this.familyGroup.getExamDownloadUrl(this.id, examId).subscribe({
      next: (response) => {
        const url = response.downloadUrl ?? (response as any).url ?? null;
        if (!url) {
          this.toast.error('No se pudo obtener el enlace de descarga');
          return;
        }
        const link = document.createElement('a');
        link.href = url;
        link.download = item.originalFileName ?? item.title ?? 'examen';
        link.click();
      },
      error: (e) => this.toast.error(e?.message || 'Error al descargar examen'),
    });
  }

  deleteExam(item: any): void {
    this.confirm('Eliminar examen', `¿Eliminar "${item.title}"?`).subscribe((ok) => {
      if (!ok) return;
      this.familyGroup.deleteExam(this.id, item.id).subscribe({
        next: () => {
          this.toast.success('Examen eliminado');
          this.loadArea('exams', this.exams);
        },
        error: (e) => this.toast.error(e?.message || 'No se pudo eliminar el examen'),
      });
    });
  }

  // --- Medicamentos ---

  addMedication(): void {
    this.dialog
      .open(MedicationFormDialogComponent, { width: '520px' })
      .afterClosed()
      .subscribe((payload: MedicationInput | null | undefined) => {
        if (!payload) return;
        this.familyGroup.createMedication(this.id, payload).subscribe({
          next: () => {
            this.toast.success('Medicamento agregado');
            this.loadArea('medications', this.medications);
          },
          error: (e) => this.toast.error(e?.message || 'No se pudo agregar el medicamento'),
        });
      });
  }

  editMedication(item: any): void {
    this.dialog
      .open(MedicationFormDialogComponent, { width: '520px', data: item as MedicationInput })
      .afterClosed()
      .subscribe((payload: MedicationInput | null | undefined) => {
        if (!payload) return;
        this.familyGroup.updateMedication(this.id, item.id, payload).subscribe({
          next: () => {
            this.toast.success('Medicamento actualizado');
            this.loadArea('medications', this.medications);
          },
          error: (e) => this.toast.error(e?.message || 'No se pudo actualizar el medicamento'),
        });
      });
  }

  deleteMedication(item: any): void {
    this.confirm('Eliminar medicamento', `¿Eliminar "${item.name}"?`).subscribe((ok) => {
      if (!ok) return;
      this.familyGroup.deleteMedication(this.id, item.id).subscribe({
        next: () => {
          this.toast.success('Medicamento eliminado');
          this.loadArea('medications', this.medications);
        },
        error: (e) => this.toast.error(e?.message || 'No se pudo eliminar el medicamento'),
      });
    });
  }

  // --- Alergias ---

  addAllergy(): void {
    this.dialog
      .open(AllergyFormDialogComponent, { width: '520px' })
      .afterClosed()
      .subscribe((payload: AllergyInput | null | undefined) => {
        if (!payload) return;
        this.familyGroup.createAllergy(this.id, payload).subscribe({
          next: () => {
            this.toast.success('Alergia agregada');
            this.loadArea('allergies', this.allergies);
          },
          error: (e) => this.toast.error(e?.message || 'No se pudo agregar la alergia'),
        });
      });
  }

  editAllergy(item: any): void {
    this.dialog
      .open(AllergyFormDialogComponent, { width: '520px', data: item as AllergyInput })
      .afterClosed()
      .subscribe((payload: AllergyInput | null | undefined) => {
        if (!payload) return;
        this.familyGroup.updateAllergy(this.id, item.id, payload).subscribe({
          next: () => {
            this.toast.success('Alergia actualizada');
            this.loadArea('allergies', this.allergies);
          },
          error: (e) => this.toast.error(e?.message || 'No se pudo actualizar la alergia'),
        });
      });
  }

  deleteAllergy(item: any): void {
    this.confirm('Eliminar alergia', `¿Eliminar "${item.allergen}"?`).subscribe((ok) => {
      if (!ok) return;
      this.familyGroup.deleteAllergy(this.id, item.id).subscribe({
        next: () => {
          this.toast.success('Alergia eliminada');
          this.loadArea('allergies', this.allergies);
        },
        error: (e) => this.toast.error(e?.message || 'No se pudo eliminar la alergia'),
      });
    });
  }

  // --- Antecedentes ---

  addBackground(): void {
    this.dialog
      .open(BackgroundFormDialogComponent, { width: '520px' })
      .afterClosed()
      .subscribe((payload: BackgroundInput | null | undefined) => {
        if (!payload) return;
        this.familyGroup.createBackground(this.id, payload).subscribe({
          next: () => {
            this.toast.success('Antecedente agregado');
            this.loadArea('background', this.background);
          },
          error: (e) => this.toast.error(e?.message || 'No se pudo agregar el antecedente'),
        });
      });
  }

  editBackground(item: any): void {
    this.dialog
      .open(BackgroundFormDialogComponent, { width: '520px', data: item as BackgroundInput })
      .afterClosed()
      .subscribe((payload: BackgroundInput | null | undefined) => {
        if (!payload) return;
        this.familyGroup.updateBackground(this.id, item.id, payload).subscribe({
          next: () => {
            this.toast.success('Antecedente actualizado');
            this.loadArea('background', this.background);
          },
          error: (e) => this.toast.error(e?.message || 'No se pudo actualizar el antecedente'),
        });
      });
  }

  deleteBackground(item: any): void {
    this.confirm('Eliminar antecedente', `¿Eliminar "${item.title}"?`).subscribe((ok) => {
      if (!ok) return;
      this.familyGroup.deleteBackground(this.id, item.id).subscribe({
        next: () => {
          this.toast.success('Antecedente eliminado');
          this.loadArea('background', this.background);
        },
        error: (e) => this.toast.error(e?.message || 'No se pudo eliminar el antecedente'),
      });
    });
  }

  // --- Citas ---

  bookAppointment(): void {
    // El ActingPatientStore ya está seteado (entramos vía el selector "Gestionar"),
    // por lo que el flujo de agendamiento descubre al profesional y
    // BookAppointmentDialogComponent detecta el contexto "actuando como"
    // para reservar la cita del paciente gestionado.
    void this.router.navigate(['/patient/wizard']);
  }

  isFutureAppointment(appt: any): boolean {
    const start = appt?.startUtc ? new Date(appt.startUtc).getTime() : NaN;
    return !isNaN(start) && start > Date.now();
  }

  cancelAppointment(appt: any): void {
    this.confirm('Cancelar cita', '¿Cancelar esta cita?', 'Cancelar cita', 'event_busy').subscribe((ok) => {
      if (!ok) return;
      this.familyGroup.cancelAppointment(this.id, appt.id).subscribe({
        next: () => {
          this.toast.success('Cita cancelada');
          this.loadArea('appointments', this.appointments);
        },
        error: (e) => this.toast.error(e?.message || 'No se pudo cancelar la cita'),
      });
    });
  }

  private confirm(
    title: string,
    message: string,
    confirmText = 'Eliminar',
    icon = 'delete_forever',
  ) {
    return this.dialog
      .open(ConfirmDialogComponent, {
        width: '420px',
        data: {
          title,
          message,
          confirmText,
          cancelText: 'Cancelar',
          confirmColor: 'warn',
          icon,
        },
      })
      .afterClosed();
  }
}
