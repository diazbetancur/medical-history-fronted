import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MenuBuilderService } from '@core/index';

/**
 * Admin Home Page Component
 *
 * Dashboard con widgets protegidos por permisos RBAC.
 * Cada widget se muestra solo si el usuario tiene acceso a la funcionalidad relacionada.
 */
@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './admin-home.page.html',
  styleUrl: './admin-home.page.scss',
})
export class AdminHomePageComponent {
  private readonly menuBuilder = inject(MenuBuilderService);

  stats = signal({
    totalProfessionals: 1847,
    pendingReview: 23,
    verifiedProfessionals: 1654,
    totalRequests: 12453,
    totalUsers: 342,
    activeRoles: 5,
  });

  recentActivities = [
    {
      id: 1,
      icon: 'person_add',
      type: 'new-user',
      text: 'Nuevo profesional registrado: María García',
      time: 'Hace 15 minutos',
    },
    {
      id: 2,
      icon: 'verified',
      type: 'verified',
      text: 'Profesional verificado: Carlos López',
      time: 'Hace 1 hora',
    },
    {
      id: 3,
      icon: 'flag',
      type: 'report',
      text: 'Nuevo reporte recibido',
      time: 'Hace 2 horas',
    },
    {
      id: 4,
      icon: 'person_add',
      type: 'new-user',
      text: 'Nuevo profesional registrado: Pedro Martínez',
      time: 'Hace 3 horas',
    },
    {
      id: 5,
      icon: 'verified',
      type: 'verified',
      text: 'Profesional verificado: Ana Rodríguez',
      time: 'Hace 5 horas',
    },
  ];

  // ============================================================================
  // Permission-based computed signals for widget visibility
  // ============================================================================

  /**
   * Can view professionals widget (stats + actions)
   */
  readonly canViewProfessionals = computed(() =>
    this.menuBuilder.canAccessRoute('/admin/professionals'),
  );

  /**
   * Can view requests widget
   */
  readonly canViewRequests = computed(() =>
    this.menuBuilder.canAccessRoute('/admin/requests'),
  );

  /**
   * Can view catalogs widget
   */
  readonly canViewCatalogs = computed(() =>
    this.menuBuilder.canAccessRoute('/admin/catalogs'),
  );

  /**
   * Can view users widget
   */
  readonly canViewUsers = computed(() =>
    this.menuBuilder.canAccessRoute('/admin/users'),
  );

  /**
   * Can view roles widget
   */
  readonly canViewRoles = computed(() =>
    this.menuBuilder.canAccessRoute('/admin/roles'),
  );

  /**
   * Can view configuration widget
   */
  readonly canViewConfig = computed(() =>
    this.menuBuilder.canAccessRoute('/admin/config'),
  );

  /**
   * Has at least one widget visible (OR logic)
   */
  readonly hasAnyWidgetVisible = computed(
    () =>
      this.canViewProfessionals() ||
      this.canViewRequests() ||
      this.canViewCatalogs() ||
      this.canViewUsers() ||
      this.canViewRoles() ||
      this.canViewConfig(),
  );
}
