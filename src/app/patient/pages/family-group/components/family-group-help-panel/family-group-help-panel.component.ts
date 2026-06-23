import { Component, inject, signal } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { PlatformService } from '@core/platform/platform.service';

export const STORAGE_KEY = 'fg-help-panel-expanded';

/**
 * Panel colapsable "¿Cómo funciona?" para el módulo de Grupo Familiar.
 * Colapsado por defecto; recuerda el estado del usuario en localStorage.
 * SSR-safe vía PlatformService (en el servidor getLocalStorage() es null).
 */
@Component({
  selector: 'app-family-group-help-panel',
  standalone: true,
  imports: [MatExpansionModule, MatIconModule],
  templateUrl: './family-group-help-panel.component.html',
  styleUrl: './family-group-help-panel.component.scss',
})
export class FamilyGroupHelpPanelComponent {
  private readonly platform = inject(PlatformService);
  readonly expanded = signal(this.readPersisted());

  onExpandedChange(open: boolean): void {
    // Avoid redundant writes (mat-expansion-panel may echo the initial state).
    if (this.expanded() === open) return;
    this.expanded.set(open);
    this.persist(open);
  }

  private readPersisted(): boolean {
    try {
      return this.platform.getLocalStorage()?.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private persist(open: boolean): void {
    try {
      this.platform.getLocalStorage()?.setItem(STORAGE_KEY, String(open));
    } catch {
      // ignore storage failures (modo privado, cuota)
    }
  }
}
