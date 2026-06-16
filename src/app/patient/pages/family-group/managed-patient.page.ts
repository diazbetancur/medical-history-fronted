import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { ToastService } from '@shared/services';
import { ActingPatientStore } from '../../services/acting-patient.store';
import { FamilyGroupService } from '../../services/family-group.service';

@Component({
  selector: 'app-managed-patient',
  standalone: true,
  imports: [DatePipe, MatTabsModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './managed-patient.page.html',
  styleUrl: './managed-patient.page.scss',
})
export class ManagedPatientPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly familyGroup = inject(FamilyGroupService);
  private readonly toast = inject(ToastService);
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
    done: () => void,
  ): void {
    this.familyGroup
      .getPatientArea<Record<string, unknown>>(this.id, area)
      .subscribe({
        next: (res) => {
          target.set(
            (res?.['items'] as any[]) ??
              (Array.isArray(res) ? (res as any[]) : []),
          );
          done();
        },
        error: () => {
          this.toast.error(`No se pudo cargar ${area}`);
          done();
        },
      });
  }
}
