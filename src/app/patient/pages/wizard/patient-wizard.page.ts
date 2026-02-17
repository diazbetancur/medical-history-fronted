import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { PatientProfileDto } from '../../models/patient-profile.dto';
import { SlotDto } from '../../models/slot.dto';
import { Step2SearchProfessionalComponent } from './steps/step2-search-professional.component';
import { Step3SlotsComponent } from './steps/step3-slots.component';
import { Step4ConfirmComponent } from './steps/step4-confirm.component';
import { Step5MyAppointmentsComponent } from './steps/step5-my-appointments.component';

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
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    Step2SearchProfessionalComponent,
    Step3SlotsComponent,
    Step4ConfirmComponent,
    Step5MyAppointmentsComponent,
  ],
  providers: [WizardStore],
  templateUrl: './patient-wizard.page.html',
  styleUrl: './patient-wizard.page.scss',
})
export class PatientWizardPage {
  readonly wizardStore = inject(WizardStore);

  // Expose wizard state for template
  readonly isStep2Complete = this.wizardStore.isStep2Complete;
  readonly isStep3Complete = this.wizardStore.isStep3Complete;
}
