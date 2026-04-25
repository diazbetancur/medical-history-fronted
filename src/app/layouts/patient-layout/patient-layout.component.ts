import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { MenuService } from '@core/services/menu.service';
import { LayoutTopbarComponent } from '@shared/ui/layout-topbar/layout-topbar.component';
import { SidebarComponent } from '@shared/ui/sidebar/sidebar.component';

/**
 * Patient Layout Component
 *
 * Layout principal para el área de pacientes (/patient/* o /)
 *
 * Features:
 * - Topbar con usuario, context selector, logout
 * - Sidebar con menú de paciente
 * - RouterOutlet para contenido dinámico
 *
 * Guards aplicados en routes:
 * - authStoreGuard (autenticación)
 * - contextGuard (contexto PATIENT)
 */
@Component({
  selector: 'app-patient-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    MatIconModule,
    LayoutTopbarComponent,
    SidebarComponent,
  ],
  templateUrl: './patient-layout.component.html',
  styleUrl: './patient-layout.component.scss',
})
export class PatientLayoutComponent {
  readonly menuService = inject(MenuService);
}
