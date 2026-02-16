import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { ExamsListComponent } from '../components/exams/exams-list.component';
import { PatientHistoryListComponent } from '../components/history/patient-history-list.component';
import { PrivacySettingsComponent } from '../components/privacy/privacy-settings.component';

/**
 * Profile Page Component
 *
 * Página de perfil del paciente con tabs para diferentes secciones
 */
@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    MatTabsModule,
    ExamsListComponent,
    PatientHistoryListComponent,
    PrivacySettingsComponent,
  ],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent {}
