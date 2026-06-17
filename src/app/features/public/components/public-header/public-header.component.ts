import { Component, Input, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '@core/auth';
import { NotificationsBellComponent } from '@shared/ui/notifications-bell/notifications-bell.component';
import {
  AuthModalComponent,
  AuthModalData,
} from '../auth-modal/auth-modal.component';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    RouterLink,
    NotificationsBellComponent,
  ],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.scss',
})
export class PublicHeaderComponent {
  @Input() floating = false;

  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);

  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly userName = this.authStore.userName;
  readonly userEmail = this.authStore.userEmail;
  readonly availableContexts = this.authStore.availableContexts;

  readonly isPatientAuthenticated = computed(() =>
    this.authStore
      .availableContexts()
      .some((context) => context.type === 'PATIENT'),
  );

  getContextIcon(type: string): string {
    switch (type) {
      case 'ADMIN':
        return 'admin_panel_settings';
      case 'PROFESSIONAL':
        return 'work';
      case 'PATIENT':
        return 'person';
      default:
        return 'dashboard';
    }
  }

  getContextLabel(type: string): string {
    switch (type) {
      case 'ADMIN':
        return 'Panel Administrativo';
      case 'PROFESSIONAL':
        return 'Área Profesional';
      case 'PATIENT':
        return 'Mi Panel';
      default:
        return type;
    }
  }

  navigateToContext(type: string): void {
    switch (type) {
      case 'ADMIN':
        this.router.navigate(['/admin']);
        break;
      case 'PROFESSIONAL':
        this.router.navigate(['/professional']);
        break;
      case 'PATIENT':
        this.router.navigate(['/patient']);
        break;
    }
  }

  openAuthModal(): void {
    this.dialog.open<AuthModalComponent, AuthModalData>(AuthModalComponent, {
      data: {},
      width: '440px',
      maxWidth: '100vw',
      panelClass: 'auth-modal-panel',
      autoFocus: 'first-tabbable',
    });
  }

  navigateToLogin(): void {
    this.openAuthModal();
  }

  logout(): void {
    this.authStore.logout();
  }
}
