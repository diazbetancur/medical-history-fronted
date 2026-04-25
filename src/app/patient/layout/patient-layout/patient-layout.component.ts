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
  templateUrl: './patient-layout.component.html',
  styleUrl: './patient-layout.component.scss',
})
export class PatientLayoutComponent {
  readonly menuService = inject(MenuService);
}
