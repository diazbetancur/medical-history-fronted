import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { AuthStore } from '@core/auth';
import { ActingPatientStore } from '../../services/acting-patient.store';
import { FamilyGroupService } from '../../services/family-group.service';
import { ManageablePatient } from '../../services/family-group.models';

@Component({
  selector: 'app-patient-switcher',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './patient-switcher.component.html',
  styleUrl: './patient-switcher.component.scss',
})
export class PatientSwitcherComponent implements OnInit {
  private readonly familyGroup = inject(FamilyGroupService);
  private readonly router = inject(Router);
  private readonly actingStore = inject(ActingPatientStore);
  protected readonly acting = this.actingStore.acting;
  protected readonly authStore = inject(AuthStore);

  protected readonly patients = signal<ManageablePatient[]>([]);

  ngOnInit(): void {
    this.familyGroup.getManageablePatients().subscribe({
      next: (p) => this.patients.set(p),
      error: () => this.patients.set([]),
    });
  }

  protected selectOwn(): void {
    this.actingStore.clear();
    this.router.navigate(['/patient']);
  }

  protected select(p: ManageablePatient): void {
    this.actingStore.set({
      patientProfileId: p.patientProfileId,
      fullName: p.fullName,
    });
    this.router.navigate(['/patient/managed', p.patientProfileId]);
  }
}
