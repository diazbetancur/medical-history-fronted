import { Component, computed, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '@core/auth';
import { ContextDto } from '@core/models';

/**
 * Layout Topbar Component
 *
 * Topbar reutilizable para todos los layouts con:
 * - Usuario (fullName + email)
 * - Cambio de contexto SOLO dentro del menú de perfil
 * - Logout
 */
@Component({
  selector: 'app-layout-topbar',
  standalone: true,
  imports: [
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './layout-topbar.component.html',
  styleUrls: ['./layout-topbar.component.scss'],
})
export class LayoutTopbarComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly menuToggle = output<void>();
  readonly logout = output<void>();

  readonly userName = computed(() => this.authStore.userName() || 'Usuario');
  readonly userEmail = computed(() => this.authStore.userEmail() || '');
  readonly currentContext = this.authStore.currentContext;
  readonly availableContexts = this.authStore.availableContexts;
  readonly hasMultipleContexts = computed(
    () => this.availableContexts().length > 1,
  );

  readonly isProfessionalContext = computed(
    () => this.currentContext()?.type === 'PROFESSIONAL',
  );
  readonly isPatientContext = computed(
    () => this.currentContext()?.type === 'PATIENT',
  );
  readonly contextIcon = computed(() =>
    this.getContextIcon(this.currentContext()?.type),
  );
  readonly contextLabel = computed(() =>
    this.getContextLabel(this.currentContext()?.type),
  );

  getContextIcon(type: string | undefined): string {
    switch (type) {
      case 'PROFESSIONAL':
        return 'medical_services';
      case 'ADMIN':
        return 'admin_panel_settings';
      default:
        return 'person';
    }
  }

  getContextLabel(type: string | undefined): string {
    switch (type) {
      case 'PROFESSIONAL':
        return 'Área Profesional';
      case 'ADMIN':
        return 'Administración';
      default:
        return 'Área Personal';
    }
  }

  switchContext(context: ContextDto): void {
    const success = this.authStore.switchContext(context);
    if (success) {
      const targetPath = this.getContextPath(context.type);
      this.router.navigate([targetPath]).then(() => {
        window.location.reload();
      });
    }
  }

  handleLogout(): void {
    this.authStore.logout();
    this.logout.emit();
  }

  private getContextPath(contextType: ContextDto['type']): string {
    switch (contextType) {
      case 'ADMIN':
        return '/admin';
      case 'PROFESSIONAL':
        return '/professional';
      case 'PATIENT':
        return '/patient';
      default:
        return '/';
    }
  }
}
