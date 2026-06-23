import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MedicationDialogComponent } from './medication-dialog.component';

describe('MedicationDialogComponent — status/isOngoing consistency', () => {
  function build(): MedicationDialogComponent {
    TestBed.configureTestingModule({
      imports: [MedicationDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: { close: () => undefined } },
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'create' } },
      ],
    });
    const component = TestBed.createComponent(MedicationDialogComponent)
      .componentInstance;
    component.ngOnInit(); // builds the form + wires the valueChanges rules
    return component;
  }

  it('choosing Suspendido turns off "en curso"', () => {
    const c = build();
    c.form.get('isOngoing')!.setValue(true);

    c.form.get('status')!.setValue('Stopped');

    expect(c.form.get('isOngoing')!.value).toBe(false);
  });

  it('turning "en curso" on while Suspendido resets the status to Active (no contradiction)', () => {
    const c = build();
    c.form.get('status')!.setValue('Stopped');
    expect(c.form.get('isOngoing')!.value).toBe(false);

    c.form.get('isOngoing')!.setValue(true);

    expect(c.form.get('status')!.value).toBe('Active');
    expect(c.form.get('isOngoing')!.value).toBe(true);
  });
});
