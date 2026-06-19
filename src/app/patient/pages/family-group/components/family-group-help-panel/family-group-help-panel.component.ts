import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

const STORAGE_KEY = 'fg-help-panel-expanded';

/**
 * Panel colapsable "¿Cómo funciona?" para el módulo de Grupo Familiar.
 * Colapsado por defecto; recuerda el estado del usuario en localStorage.
 * SSR-safe: en el servidor no toca localStorage y arranca colapsado.
 */
@Component({
  selector: 'app-family-group-help-panel',
  standalone: true,
  imports: [MatExpansionModule, MatIconModule],
  templateUrl: './family-group-help-panel.component.html',
  styleUrl: './family-group-help-panel.component.scss',
})
export class FamilyGroupHelpPanelComponent {
  private readonly platformId = inject(PLATFORM_ID);
  readonly expanded = signal(this.readPersisted());

  onExpandedChange(open: boolean): void {
    this.expanded.set(open);
    this.persist(open);
  }

  private readPersisted(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private persist(open: boolean): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(STORAGE_KEY, String(open));
    } catch {
      // ignore storage failures (modo privado, cuota)
    }
  }
}
