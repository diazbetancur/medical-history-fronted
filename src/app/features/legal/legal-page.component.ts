import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="legal-container">
      <a routerLink="/" mat-button class="back-btn">
        <mat-icon>arrow_back</mat-icon>
        Volver al inicio
      </a>
      <h1>{{ title }}</h1>
      <p class="placeholder">
        Este contenido está siendo preparado. Por favor, vuelve a consultar próximamente.
      </p>
      <p class="contact">
        Si tienes consultas urgentes, contáctanos en
        <a href="mailto:contacto@meditigo.com">contacto&#64;meditigo.com</a>.
      </p>
    </div>
  `,
  styles: [`
    .legal-container {
      max-width: 800px;
      margin: 64px auto;
      padding: 0 24px;
    }
    .back-btn { margin-bottom: 24px; }
    h1 { margin-bottom: 16px; }
    .placeholder, .contact { color: #555; line-height: 1.7; }
    a { color: inherit; }
  `],
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly title: string = this.route.snapshot.data['pageTitle'] ?? 'Información Legal';
}
