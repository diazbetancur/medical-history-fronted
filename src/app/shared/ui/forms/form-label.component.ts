import { Component, input } from '@angular/core';

@Component({
  selector: 'app-form-label',
  standalone: true,
  template: `
    <span class="app-form-label">
      {{ text() }}
      @if (required()) {
        <span class="sr-only"> obligatorio</span>
      }
    </span>
  `,
  styles: [
    `
      .app-form-label {
        display: inline-flex;
        align-items: center;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `,
  ],
})
export class FormLabelComponent {
  readonly text = input.required<string>();
  readonly required = input(false);
}
