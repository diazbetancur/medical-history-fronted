import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '@core/auth';
import { AuthIntentService } from '../../services/auth-intent.service';
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
    RouterLink,
  ],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.scss',
})
export class PublicHeaderComponent {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);
  private readonly dialog = inject(MatDialog);
  private readonly authIntent = inject(AuthIntentService);

  readonly isAuthenticated = this.authStore.isAuthenticated;
  readonly isPatientAuthenticated = computed(() =>
    this.authStore
      .availableContexts()
      .some((context) => context.type === 'PATIENT'),
  );

  openAuthModal(asProfessional: boolean): void {
    this.authIntent.setAsProfessional(asProfessional);
    this.dialog.open<AuthModalComponent, AuthModalData>(AuthModalComponent, {
      data: { asProfessional },
      width: '440px',
      maxWidth: '100vw',
      panelClass: 'auth-modal-panel',
      autoFocus: 'first-tabbable',
    });
  }

  navigateToLogin(): void {
    this.openAuthModal(false);
  }

  navigateToProfessional(): void {
    if (this.authStore.isAuthenticated()) {
      this.router.navigate(['/professional']);
    } else {
      this.openAuthModal(true);
    }
  }

  logout(): void {
    this.authStore.logout();
  }
}
