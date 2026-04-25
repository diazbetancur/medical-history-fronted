import { Component, computed, effect, input, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {
  FormErrorMessageMap,
  RequiredMessageMode,
  resolveControlErrorMessage,
} from '@shared/utils/form-validation';

@Component({
  selector: 'app-form-control-error',
  standalone: true,
  imports: [MatFormFieldModule],
  templateUrl: './form-control-error.component.html',
})
export class FormControlErrorComponent {
  readonly control = input<AbstractControl | null>(null);
  readonly submitted = input(false);
  readonly force = input(false);
  readonly requiredMode = input<RequiredMessageMode>('text');
  readonly messages = input<FormErrorMessageMap>({});

  private readonly controlStateVersion = signal(0);

  readonly message = computed(() => {
    this.controlStateVersion();
    return resolveControlErrorMessage(this.control(), {
      submitted: this.submitted(),
      force: this.force(),
      requiredMode: this.requiredMode(),
      messages: this.messages(),
    });
  });

  constructor() {
    // Keep UI in sync for blur/touched, status and value changes.
    effect((onCleanup) => {
      const ctrl = this.control();
      if (!ctrl) return;

      const eventStream =
        'events' in ctrl
          ? (
              ctrl as AbstractControl & {
                events?: {
                  subscribe: (cb: () => void) => { unsubscribe: () => void };
                };
              }
            ).events
          : undefined;

      const statusSub = ctrl.statusChanges?.subscribe(() => {
        this.controlStateVersion.update((v) => v + 1);
      });
      const valueSub = ctrl.valueChanges?.subscribe(() => {
        this.controlStateVersion.update((v) => v + 1);
      });
      const eventSub = eventStream?.subscribe(() => {
        this.controlStateVersion.update((v) => v + 1);
      });

      onCleanup(() => {
        statusSub?.unsubscribe();
        valueSub?.unsubscribe();
        eventSub?.unsubscribe();
      });
    });
  }
}
