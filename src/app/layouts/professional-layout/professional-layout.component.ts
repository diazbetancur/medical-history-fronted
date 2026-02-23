import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { MenuService } from '@core/services/menu.service';
import { LayoutTopbarComponent } from '@shared/ui/layout-topbar/layout-topbar.component';
import { SidebarComponent } from '@shared/ui/sidebar/sidebar.component';

/**
 * Professional Layout Component
 *
 * Layout principal para el área profesional (/professional/*)
 *
 * Features:
 * - Topbar con usuario, context selector, logout
 * - Sidebar con menú profesional
 * - RouterOutlet para contenido dinámico
 *
 * Guards aplicados en routes:
 * - authStoreGuard (autenticación)
 * - contextGuard (contexto PROFESSIONAL)
 */
@Component({
  selector: 'app-professional-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    MatIconModule,
    LayoutTopbarComponent,
    SidebarComponent,
  ],
  templateUrl: './professional-layout.component.html',
  styleUrl: './professional-layout.component.scss',
})
export class ProfessionalLayoutComponent {
  readonly menuService = inject(MenuService);
}
