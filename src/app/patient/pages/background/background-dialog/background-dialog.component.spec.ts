import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BackgroundDialogComponent } from './background-dialog.component';

describe('BackgroundDialogComponent — chronic type unifies the chronic flag', () => {
  let dialogRef: jasmine.SpyObj<MatDialogRef<BackgroundDialogComponent>>;

  function build(): BackgroundDialogComponent {
    dialogRef = jasmine.createSpyObj<MatDialogRef<BackgroundDialogComponent>>(
      'MatDialogRef',
      ['close'],
    );
    TestBed.configureTestingModule({
      imports: [BackgroundDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'create' } },
      ],
    });
    const component = TestBed.createComponent(BackgroundDialogComponent)
      .componentInstance;
    component.ngOnInit();
    return component;
  }

  it('forces isChronic ON (and locks it) when the type is "Crónico", and submits it as chronic', () => {
    const c = build();

    c.form.get('type')!.setValue('Chronic');

    expect(c.form.get('isChronic')!.value).toBe(true);
    expect(c.form.get('isChronic')!.disabled).toBeTrue();

    c.form.get('title')!.setValue('Hipertensión');
    c.onSubmit();

    expect(dialogRef.close).toHaveBeenCalled();
    const dto = dialogRef.close.calls.mostRecent().args[0] as {
      isChronic: boolean;
      type: string;
    };
    expect(dto.type).toBe('Chronic');
    expect(dto.isChronic).toBeTrue(); // captured despite the disabled control
  });

  it('re-enables and clears isChronic when switching away from "Crónico"', () => {
    const c = build();
    c.form.get('type')!.setValue('Chronic');

    c.form.get('type')!.setValue('Surgical');

    expect(c.form.get('isChronic')!.disabled).toBeFalse();
    expect(c.form.get('isChronic')!.value).toBe(false);
  });
});
