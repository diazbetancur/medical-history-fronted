import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { MenuService } from '@core/services/menu.service';
import { LayoutTopbarComponent } from '@shared/ui/layout-topbar/layout-topbar.component';
import { SidebarComponent } from '@shared/ui/sidebar/sidebar.component';

/**
 * Admin Layout Component
 *
 * Layout principal para el área de administración (/admin/*)
 *
 * Features:
 * - Topbar con usuario, context selector, logout
 * - Sidebar con menú de administración
 * - RouterOutlet para contenido dinámico
 *
 * Guards aplicados en routes:
 * - authStoreGuard (autenticación)
 * - contextGuard (contexto ADMIN)
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    MatIconModule,
    LayoutTopbarComponent,
    SidebarComponent,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  readonly menuService = inject(MenuService);
}
