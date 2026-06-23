import { Component, computed, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Muestra la especialidad principal de un profesional y, si hay más, un chip
 * "+N" con tooltip que lista todas. Mantiene la card compacta y con altura fija
 * sin importar cuántas especialidades tenga.
 *
 * Acepta el string unido por comas que ya entrega el backend
 * (ej. "Cardiología, Pediatría, Dermatología").
 */
@Component({
  selector: 'app-specialty-summary',
  standalone: true,
  imports: [MatTooltipModule],
  template: `
    @if (primary()) {
      <span class="specialty-summary">
        <span class="specialty-summary__name">{{ primary() }}</span>
        @if (extraCount() > 0) {
          <span
            class="specialty-summary__more"
            [matTooltip]="all()"
            matTooltipPosition="above"
            >+{{ extraCount() }}</span
          >
        }
      </span>
    }
  `,
  styleUrl: './specialty-summary.component.scss',
})
export class SpecialtySummaryComponent {
  /** Especialidades unidas por coma, ej. "Cardiología, Pediatría". */
  readonly value = input<string | null | undefined>('');

  private readonly list = computed(() =>
    (this.value() ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

  protected readonly primary = computed(() => this.list()[0] ?? '');
  protected readonly extraCount = computed(() =>
    Math.max(0, this.list().length - 1),
  );
  protected readonly all = computed(() => this.list().join(', '));
}
