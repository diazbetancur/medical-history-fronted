import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { BookAppointmentDialogComponent } from '@features/public/components/book-appointment-dialog.component';
import { PatientProfileDto } from '../../models/patient-profile.dto';
import { SlotDto } from '../../models/slot.dto';
import {
  RequestAppointmentDialogComponent,
  SelectedProfessionalForBooking,
} from '../home/request-appointment-dialog.component';

/**
 * Selected professional for wizard
 */
export interface SelectedProfessional {
  professionalProfileId: string;
  slug: string;
  name: string;
  specialty?: string;
}

/**
 * Wizard Store (internal to wizard page)
 * Manages wizard state across steps using signals
 */
export class WizardStore {
  // Step 1: Profile
  private readonly _profile = signal<PatientProfileDto | null>(null);
  readonly profile = this._profile.asReadonly();

  // Step 2: Professional
  private readonly _selectedProfessional = signal<SelectedProfessional | null>(
    null,
  );
  readonly selectedProfessional = this._selectedProfessional.asReadonly();

  // Step 3: Date & Slot
  private readonly _selectedDate = signal<string | null>(null);
  private readonly _selectedSlot = signal<SlotDto | null>(null);
  readonly selectedDate = this._selectedDate.asReadonly();
  readonly selectedSlot = this._selectedSlot.asReadonly();

  // Computed: Check if each step is complete
  readonly isStep1Complete = computed(() => !!this._profile());
  readonly isStep2Complete = computed(() => !!this._selectedProfessional());
  readonly isStep3Complete = computed(
    () => !!this._selectedDate() && !!this._selectedSlot(),
  );

  // Actions
  setProfile(profile: PatientProfileDto): void {
    this._profile.set(profile);
  }

  setProfessional(professional: SelectedProfessional): void {
    this._selectedProfessional.set(professional);
  }

  setDateAndSlot(date: string, slot: SlotDto): void {
    this._selectedDate.set(date);
    this._selectedSlot.set(slot);
  }

  reset(): void {
    this._profile.set(null);
    this._selectedProfessional.set(null);
    this._selectedDate.set(null);
    this._selectedSlot.set(null);
  }
}

@Component({
  selector: 'app-patient-wizard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
  ],
  templateUrl: './patient-wizard.page.html',
  styleUrl: './patient-wizard.page.scss',
})
export class PatientWizardPage implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  ngOnInit(): void {
    queueMicrotask(() => this.openRequestAppointment());
  }

  openRequestAppointment(): void {
    const selectorRef = this.dialog.open(RequestAppointmentDialogComponent, {
      width: '980px',
      maxWidth: '96vw',
      data: {
        pageSize: 12,
      },
    });

    selectorRef
      .afterClosed()
      .subscribe((selected: SelectedProfessionalForBooking | null) => {
        if (!selected) {
          this.router.navigate(['/patient']);
          return;
        }

        this.dialog.open(BookAppointmentDialogComponent, {
          width: '760px',
          maxWidth: '96vw',
          data: {
            slug: selected.slug,
            professionalId: selected.professionalProfileId,
            name: selected.fullName,
            imageUrl: selected.photoUrl,
            specialties: selected.specialty ? [selected.specialty] : [],
          },
        });
      });
  }
}
