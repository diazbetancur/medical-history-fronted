import { afterNextRender, Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { RouterOutlet } from '@angular/router';
import { AuthStore } from '@core/auth';
import { MenuService } from '@core/services/menu.service';
import { LayoutTopbarComponent } from '@shared/ui/layout-topbar/layout-topbar.component';
import { SidebarComponent } from '@shared/ui/sidebar/sidebar.component';

/**
 * Diálogo informativo para profesionales recién registrados
 * que aún no han completado su perfil profesional.
 */
@Component({
  selector: 'app-profile-required-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div mat-dialog-title class="dialog-header">
      <mat-icon color="primary">manage_accounts</mat-icon>
      <span>Completa tu perfil profesional</span>
    </div>
    <mat-dialog-content class="dialog-body">
      <p>
        Bienvenido al área profesional. Para acceder a
        <strong>Mis Citas, Disponibilidad y Pacientes</strong>,
        primero debes completar tu perfil profesional.
      </p>
      <p>
        Una vez guardado, todas las secciones estarán disponibles
        automáticamente.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" [mat-dialog-close]="true">
        Entendido, voy a completarlo
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .dialog-header {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .dialog-body p {
        margin-bottom: 10px;
        line-height: 1.6;
      }
    `,
  ],
})
export class ProfileRequiredDialogComponent {}

/**
 * Professional Layout Component
 *
 * Layout principal para el área profesional (/professional/*)
 *
 * Features:
 * - Topbar con usuario, context selector, logout
 * - Sidebar con menú profesional (filtrado según estado del perfil)
 * - RouterOutlet para contenido dinámico
 * - Modal de bienvenida para profesionales sin perfil aún creado
 *
 * Guards aplicados en routes:
 * - authStoreGuard (autenticación)
 * - contextGuard (contexto PROFESSIONAL)
 * - professionalProfileGuard (redirige a /professional/profile si no hay perfil)
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
export class ProfessionalLayoutComponent implements OnInit {
  readonly menuService = inject(MenuService);

  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);

  private static readonly WELCOME_SESSION_KEY = 'pro_profile_welcome_shown';

  ngOnInit(): void {
    const ctx = this.authStore.availableContexts().find((c) => c.type === 'PROFESSIONAL');
    if (ctx) this.authStore.switchContext(ctx);
  }

  constructor() {
    afterNextRender(() => {
      const user = this.authStore.user();
      if (user && !user.hasProfessionalProfile) {
        // Mostrar el modal una sola vez por sesión de navegador
        if (!sessionStorage.getItem(ProfessionalLayoutComponent.WELCOME_SESSION_KEY)) {
          sessionStorage.setItem(ProfessionalLayoutComponent.WELCOME_SESSION_KEY, '1');
          this.dialog.open(ProfileRequiredDialogComponent, {
            width: '460px',
            maxWidth: '96vw',
            disableClose: false,
          });
        }
      }
    });
  }
}
