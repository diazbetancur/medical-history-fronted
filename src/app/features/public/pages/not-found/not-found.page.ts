import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <mat-icon class="not-found-icon">search_off</mat-icon>
        <h1>Página no encontrada</h1>
        <p>Lo sentimos, la página que buscas no existe o fue movida.</p>
        <div class="actions">
          <a mat-raised-button color="primary" routerLink="/">
            <mat-icon>home</mat-icon>
            Ir al Inicio
          </a>
          <a mat-stroked-button routerLink="/search">
            <mat-icon>search</mat-icon>
            Buscar Profesionales
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .not-found-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        padding: 24px;
        text-align: center;
      }

      .not-found-content {
        max-width: 400px;
      }

      .not-found-icon {
        font-size: 96px;
        width: 96px;
        height: 96px;
        color: var(--color-text-tertiary);
        margin-bottom: 24px;
      }

      h1 {
        font-size: 2rem;
        margin: 0 0 8px;
        color: var(--color-text-primary);
      }

      p {
        color: var(--color-text-secondary);
        margin-bottom: 32px;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: center;

        a {
          mat-icon {
            margin-right: 8px;
          }
        }
      }
    `,
  ],
})
export class NotFoundPageComponent {}
