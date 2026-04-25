import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { MenuService } from '@core/services/menu.service';
import { LayoutTopbarComponent } from '@shared/ui/layout-topbar/layout-topbar.component';
import { SidebarComponent } from '@shared/ui/sidebar/sidebar.component';

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
  template: `
    <mat-sidenav-container class="layout-container">
      <!-- Sidebar -->
      <mat-sidenav #drawer mode="side" opened class="layout-sidenav">
        <div class="sidenav-header">
          <mat-icon>person</mat-icon>
          <h2>Área Paciente</h2>
        </div>

        <app-sidebar [items]="menuService.filteredMenuItems()" />
      </mat-sidenav>

      <!-- Main Content -->
      <mat-sidenav-content>
        <app-layout-topbar (menuToggle)="drawer.toggle()" />

        <main class="layout-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .layout-container {
        height: 100vh;
      }

      .layout-sidenav {
        width: 260px;
        border-right: 1px solid var(--color-border);
      }

      .sidenav-header {
        padding: 24px 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-bottom: 1px solid var(--color-border);

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: var(--primary-color);
        }

        h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 500;
        }
      }

      app-sidebar {
        display: block;
        padding-top: 8px;
      }

      .layout-content {
        padding: 24px;
        min-height: calc(100vh - 64px);
      }

      @media (max-width: 768px) {
        .layout-sidenav {
          width: 220px;
        }

        .layout-content {
          padding: 16px;
        }
      }
    `,
  ],
})
export class PatientLayoutComponent {
  readonly menuService = inject(MenuService);
}
