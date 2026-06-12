import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthStore } from '@core/auth';

@Component({
  selector: 'app-professional-suspended',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="suspended-container">
      <mat-card class="suspended-card">
        <mat-card-content>
          <div class="suspended-icon">
            <mat-icon>block</mat-icon>
          </div>
          <h1 class="suspended-title">Cuenta desactivada</h1>
          <p class="suspended-message">
            Tu perfil profesional ha sido desactivado por un administrador.<br />
            Si crees que esto es un error, contacta al equipo de soporte.
          </p>
          <div class="suspended-actions">
            <button mat-flat-button color="primary" (click)="goToPatient()">
              <mat-icon>person</mat-icon>
              Ir a mi área de paciente
            </button>
            <button mat-stroked-button (click)="logout()">
              <mat-icon>logout</mat-icon>
              Cerrar sesión
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .suspended-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      padding: 24px;
    }
    .suspended-card {
      max-width: 480px;
      width: 100%;
      text-align: center;
    }
    .suspended-icon mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #c62828;
      margin-bottom: 16px;
    }
    .suspended-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0 0 12px;
    }
    .suspended-message {
      color: var(--mat-sys-on-surface-variant);
      margin: 0 0 24px;
      line-height: 1.6;
    }
    .suspended-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;
    }
    button { min-width: 220px; }
  `],
})
export class ProfessionalSuspendedPage {
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);

  goToPatient(): void {
    this.router.navigate(['/patient']);
  }

  logout(): void {
    this.authStore.logout();
  }
}
