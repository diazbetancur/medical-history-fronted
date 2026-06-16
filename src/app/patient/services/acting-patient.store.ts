import { computed, Injectable, signal } from '@angular/core';

export interface ActingPatient {
  patientProfileId: string;
  fullName: string;
}

@Injectable({ providedIn: 'root' })
export class ActingPatientStore {
  private readonly _acting = signal<ActingPatient | null>(null);
  readonly acting = this._acting.asReadonly();
  readonly isActing = computed(() => this._acting() !== null);

  set(patient: ActingPatient | null): void {
    this._acting.set(patient);
  }

  clear(): void {
    this._acting.set(null);
  }
}
