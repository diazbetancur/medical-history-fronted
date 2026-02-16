import { Component, computed, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { AuthStore } from '@core/auth';
import { ContextDto } from '@core/models';

/**
 * Layout Topbar Component
 *
 * Topbar reutilizable para todos los layouts con:
 * - Usuario (fullName + email)
 * - Context Selector (si tiene múltiples contextos)
 * - Logout
 *
 * @example
 * ```html
 * <app-layout-topbar
 *   (menuToggle)="drawer.toggle()"
 *   (logout)="handleLogout()"
 * />
 * ```
 */
@Component({
  selector: 'app-layout-topbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
  ],
  template: `
    <mat-toolbar color="primary" class="topbar">
      <!-- Menu toggle (mobile) -->
      <button mat-icon-button class="menu-toggle" (click)="menuToggle.emit()">
        <mat-icon>menu</mat-icon>
      </button>

      <!-- App title -->
      <span class="app-title">Directory Pro</span>

      <span class="spacer"></span>

      <!-- Context Selector (si tiene múltiples contextos) -->
      @if (hasMultipleContexts()) {
        <button
          mat-button
          [matMenuTriggerFor]="contextMenu"
          class="context-button"
        >
          <mat-icon>swap_horiz</mat-icon>
          {{ currentContextName() }}
        </button>
        <mat-menu #contextMenu="matMenu">
          @for (ctx of availableContexts(); track ctx.id) {
            <button
              mat-menu-item
              [disabled]="ctx.id === currentContext()?.id"
              (click)="switchContext(ctx)"
            >
              <mat-icon>
                @if (ctx.type === 'ADMIN') {
                  admin_panel_settings
                }
                @if (ctx.type === 'PROFESSIONAL') {
                  work
                }
                @if (ctx.type === 'PATIENT') {
                  person
                }
              </mat-icon>
              <span>{{ ctx.name }}</span>
              @if (ctx.id === currentContext()?.id) {
                <mat-icon class="check-icon">check</mat-icon>
              }
            </button>
          }
        </mat-menu>
      }

      <!-- User Menu -->
      <button mat-button [matMenuTriggerFor]="userMenu" class="user-button">
        <mat-icon>account_circle</mat-icon>
        {{ userName() }}
      </button>
      <mat-menu #userMenu="matMenu">
        <div class="user-info">
          <div class="user-name">{{ userName() }}</div>
          <div class="user-email">{{ userEmail() }}</div>
        </div>
        <mat-divider></mat-divider>
        <button mat-menu-item routerLink="/profile">
          <mat-icon>person</mat-icon>
          <span>Mi Perfil</span>
        </button>
        <button mat-menu-item routerLink="/settings">
          <mat-icon>settings</mat-icon>
          <span>Configuración</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="handleLogout()">
          <mat-icon>logout</mat-icon>
          <span>Cerrar Sesión</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [
    `
      .topbar {
        position: sticky;
        top: 0;
        z-index: 1000;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .menu-toggle {
        margin-right: 8px;
      }

      .app-title {
        font-size: 1.25rem;
        font-weight: 500;
      }

      .spacer {
        flex: 1 1 auto;
      }

      .context-button,
      .user-button {
        margin-left: 8px;

        mat-icon {
          margin-right: 4px;
        }
      }

      .user-info {
        padding: 12px 16px;

        .user-name {
          font-weight: 500;
          font-size: 0.95rem;
        }

        .user-email {
          font-size: 0.85rem;
          color: rgba(0, 0, 0, 0.6);
          margin-top: 2px;
        }
      }

      .check-icon {
        margin-left: auto;
        color: var(--primary-color);
      }

      @media (max-width: 768px) {
        .app-title {
          font-size: 1rem;
        }

        .user-button,
        .context-button {
          ::ng-deep .mat-button-wrapper {
            display: flex;
            align-items: center;
          }

          span {
            display: none;
          }
        }
      }
    `,
  ],
})
export class LayoutTopbarComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  // Outputs
  readonly menuToggle = output<void>();
  readonly logout = output<void>();

  // Computed signals
  readonly userName = computed(() => this.authStore.userName() || 'Usuario');
  readonly userEmail = computed(() => this.authStore.userEmail() || '');
  readonly currentContext = this.authStore.currentContext;
  readonly availableContexts = this.authStore.availableContexts;
  readonly currentContextName = computed(
    () => this.currentContext()?.name || 'Sin Contexto',
  );
  readonly hasMultipleContexts = computed(
    () => this.availableContexts().length > 1,
  );

  switchContext(context: ContextDto): void {
    const success = this.authStore.switchContext(context);
    if (success) {
      // Redirigir según el tipo de contexto
      const targetPath = this.getContextPath(context.type);
      this.router.navigate([targetPath]).then(() => {
        window.location.reload(); // Recargar para aplicar cambios
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
